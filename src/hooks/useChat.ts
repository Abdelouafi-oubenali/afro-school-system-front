import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import chatApi, { type ChatMessage, type ChatSendPayload } from "../services/chat/chatApi";
import chatSocket, { type ChatConnectionStatus } from "../services/chat/chatSocket";
import type { ChatContact } from "../services/chat/mockContacts";

export interface ChatUiMessage extends ChatMessage {
    localId: string;
    direction: "in" | "out";
    pending?: boolean;
    failed?: boolean;
}

export interface ChatConversation {
    id: string;
    name: string;
    role?: string;
    unreadCount: number;
    lastMessage: string;
    lastMessageAt?: string;
}

const makeLocalId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function getMessageDateValue(value?: string): number {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
}

function toUiMessage(message: ChatMessage, currentUserId: string): ChatUiMessage {
    return {
        ...message,
        localId: message.id || makeLocalId(),
        direction: message.senderId === currentUserId ? "out" : "in",
    };
}

function dedupeMessages(messages: ChatUiMessage[]): ChatUiMessage[] {
    const seen = new Set<string>();
    const result: ChatUiMessage[] = [];

    for (const msg of messages) {
        const key = msg.id || `${msg.senderId}-${msg.receiverId}-${msg.content}-${msg.createdAt}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(msg);
    }

    return result.sort((a, b) => getMessageDateValue(a.createdAt) - getMessageDateValue(b.createdAt));
}

function getPartnerId(message: ChatMessage, currentUserId: string): string {
    return message.senderId === currentUserId ? message.receiverId : message.senderId;
}

function mergeIncomingMessage(
    existing: ChatUiMessage[],
    incoming: ChatUiMessage,
    currentUserId: string,
    partnerId: string
): ChatUiMessage[] {
    // Replace matching optimistic draft (same conversation + content), even if backend swaps sender/receiver.
    const optimisticIndex = existing.findIndex((msg) =>
        msg.pending &&
        msg.direction === "out" &&
        msg.senderId === currentUserId &&
        msg.receiverId === partnerId &&
        msg.content === incoming.content
    );

    if (optimisticIndex !== -1) {
        const next = [...existing];
        next[optimisticIndex] = {
            ...incoming,
            localId: next[optimisticIndex].localId,
            direction: "out",
            pending: false,
            failed: false,
        };
        return dedupeMessages(next);
    }

    return dedupeMessages([...existing, incoming]);
}

export function useChat(currentUserId: string | null, contacts: ChatContact[]) {
    const [connectionStatus, setConnectionStatus] = useState<ChatConnectionStatus>("disconnected");
    const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatUiMessage[]>>({});
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeConversationRef = useRef<string | null>(null);

    useEffect(() => {
        activeConversationRef.current = activeConversationId;
    }, [activeConversationId]);

    const contactsById = useMemo(() => {
        const map = new Map<string, ChatContact>();
        for (const contact of contacts) {
            map.set(contact.id, contact);
        }
        return map;
    }, [contacts]);

    const loadConversationHistory = useCallback(async (partnerId: string) => {
        if (!currentUserId || !partnerId) return;

        try {
            setLoadingHistory(true);
            setError(null);

            const [sent, received] = await Promise.all([
                chatApi.getMessagesBySender(currentUserId),
                chatApi.getMessagesByReceiver(currentUserId),
            ]);

            const merged = [...sent, ...received]
                .filter((msg) => getPartnerId(msg, currentUserId) === partnerId)
                .map((msg) => toUiMessage(msg, currentUserId));

            setMessagesByConversation((prev) => ({
                ...prev,
                [partnerId]: dedupeMessages([...(prev[partnerId] || []), ...merged]),
            }));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur de chargement des messages");
        } finally {
            setLoadingHistory(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        if (!currentUserId) return;

        chatSocket.connect(
            currentUserId,
            (incoming) => {
                const partnerId = getPartnerId(incoming, currentUserId);
                const ui = toUiMessage(incoming, currentUserId);

                setMessagesByConversation((prev) => ({
                    ...prev,
                    [partnerId]: mergeIncomingMessage(prev[partnerId] || [], ui, currentUserId, partnerId),
                }));

                if (activeConversationRef.current !== partnerId) {
                    setUnreadByConversation((prev) => ({
                        ...prev,
                        [partnerId]: (prev[partnerId] || 0) + 1,
                    }));
                }
            },
            setConnectionStatus
        );

        return () => {
            chatSocket.disconnect();
            setConnectionStatus("disconnected");
        };
    }, [currentUserId]);

    useEffect(() => {
        if (!currentUserId) return;
        if (!activeConversationId) return;
        void loadConversationHistory(activeConversationId);
    }, [currentUserId, activeConversationId, loadConversationHistory]);

    const conversationIds = useMemo(() => {
        const ids = new Set<string>(contacts.map((contact) => contact.id));
        Object.keys(messagesByConversation).forEach((id) => ids.add(id));
        Object.keys(unreadByConversation).forEach((id) => ids.add(id));
        if (currentUserId) ids.delete(currentUserId);
        return Array.from(ids);
    }, [contacts, currentUserId, messagesByConversation, unreadByConversation]);

    const conversations = useMemo<ChatConversation[]>(() => {
        const list = conversationIds.map((id) => {
            const contact = contactsById.get(id);
            const messages = messagesByConversation[id] || [];
            const last = messages[messages.length - 1];

            return {
                id,
                name: contact?.name || id,
                role: contact?.role,
                unreadCount: unreadByConversation[id] || 0,
                lastMessage: last?.content || "Aucun message",
                lastMessageAt: last?.createdAt,
            };
        });

        return list.sort((a, b) => getMessageDateValue(b.lastMessageAt) - getMessageDateValue(a.lastMessageAt));
    }, [conversationIds, contactsById, messagesByConversation, unreadByConversation]);

    useEffect(() => {
        if (activeConversationId) return;
        if (conversations.length === 0) return;
        setActiveConversationId(conversations[0].id);
    }, [activeConversationId, conversations]);

    const activeMessages = useMemo(() => {
        if (!activeConversationId) return [];
        return messagesByConversation[activeConversationId] || [];
    }, [activeConversationId, messagesByConversation]);

    const selectConversation = useCallback((conversationId: string) => {
        setActiveConversationId(conversationId);
        setUnreadByConversation((prev) => ({ ...prev, [conversationId]: 0 }));
    }, []);

    const sendMessage = useCallback(async (content: string) => {
        if (!currentUserId || !activeConversationId) return;

        const trimmed = content.trim();
        if (!trimmed) return;

        setError(null);

        const payload: ChatSendPayload = {
            senderId: currentUserId,
            receiverId: activeConversationId,
            content: trimmed,
        };

        const optimistic: ChatUiMessage = {
            ...payload,
            localId: makeLocalId(),
            direction: "out",
            createdAt: new Date().toISOString(),
            pending: true,
        };

        setMessagesByConversation((prev) => ({
            ...prev,
            [activeConversationId]: dedupeMessages([...(prev[activeConversationId] || []), optimistic]),
        }));

        try {
            if (chatSocket.isConnected) {
                chatSocket.sendMessage(payload);
            } else {
                const saved = await chatApi.createMessage(payload);
                const savedUi = toUiMessage(saved, currentUserId);
                setMessagesByConversation((prev) => ({
                    ...prev,
                    [activeConversationId]: dedupeMessages([
                        ...(prev[activeConversationId] || []).filter((item) => item.localId !== optimistic.localId),
                        savedUi,
                    ]),
                }));
            }
        } catch (err) {
            setMessagesByConversation((prev) => ({
                ...prev,
                [activeConversationId]: (prev[activeConversationId] || []).map((item) =>
                    item.localId === optimistic.localId ? { ...item, pending: false, failed: true } : item
                ),
            }));
            setError(err instanceof Error ? err.message : "Erreur d'envoi du message");
        }
    }, [activeConversationId, currentUserId]);

    return {
        connectionStatus,
        conversations,
        activeConversationId,
        activeConversation: conversations.find((item) => item.id === activeConversationId) || null,
        activeMessages,
        loadingHistory,
        error,
        selectConversation,
        sendMessage,
        refreshActiveConversation: () => activeConversationId && loadConversationHistory(activeConversationId),
    };
}
