import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import ConversationList from "../../components/chat/ConversationList";
import ChatHeader from "../../components/chat/ChatHeader";
import MessageList from "../../components/chat/MessageList";
import MessageInput from "../../components/chat/MessageInput";
import { useAuth, isTeacherRole, isStudentRole, isParentRole } from "../../context/AuthContext";
import { useChat } from "../../hooks/useChat";
import { useChatContacts } from "../../hooks/useChatContacts";

export default function ChatPage() {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    const [mobilePane, setMobilePane] = useState<"list" | "chat">("list");
    const [searchQuery, setSearchQuery] = useState("");

    const isTeacher = isTeacherRole(user.role);
    const isStudent = isStudentRole(user.role);
    const isParent = isParentRole(user.role);

    const backUrl = isTeacher ? "/enseignant" : isStudent ? "/eleve" : isParent ? "/parent" : "/dashboard";

    return (
        <div className={`min-h-screen bg-ice text-navy font-sans ${isTeacher || isStudent || isParent ? 'p-4 md:p-6' : ''}`}>
            {!(isTeacher || isStudent || isParent) ? (
                <Layout>
                    <ChatContent
                        user={user}
                        backUrl={backUrl}
                        mobilePane={mobilePane}
                        setMobilePane={setMobilePane}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                </Layout>
            ) : (
                <ChatContent
                    user={user}
                    backUrl={backUrl}
                    mobilePane={mobilePane}
                    setMobilePane={setMobilePane}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            )}
        </div>
    );
}

function ChatContent({ user, backUrl, mobilePane, setMobilePane, searchQuery, setSearchQuery }: any) {
    let { contacts, loading: loadingContacts } = useChatContacts(user.id);

    // Restriction for parents: only see Admins and Teachers
    if (isParentRole(user.role)) {
        contacts = contacts.filter(c =>
            c.role === "ADMIN" ||
            c.role === "ENSEIGNANT" ||
            (c.role || "").toLowerCase().includes("admin") ||
            (c.role || "").toLowerCase().includes("enseign")
        );
    }

    const {
        connectionStatus,
        conversations,
        activeConversationId,
        activeConversation,
        activeMessages,
        loadingHistory,
        error,
        selectConversation,
        sendMessage,
        refreshActiveConversation,
    } = useChat(user.id, contacts);

    const filteredConversations = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return conversations;

        return conversations.filter((conversation) => {
            const name = (conversation.name || "").toLowerCase();
            const role = (conversation.role || "").toLowerCase();
            const preview = (conversation.lastMessage || "").toLowerCase();
            return name.includes(query) || role.includes(query) || preview.includes(query);
        });
    }, [conversations, searchQuery]);

    const handleSelectConversation = (conversationId: string) => {
        selectConversation(conversationId);
        setMobilePane("chat");
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="font-display text-[22px] text-navy leading-tight">Messagerie</h1>
                    <p className="text-slate text-[13px] mt-0.5">Chat temps réel + fallback REST</p>
                </div>
                <Link
                    to={backUrl}
                    className="px-3 py-2 rounded-xl border border-navy/15 text-sm font-semibold text-navy hover:bg-ice"
                >
                    Retour
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-navy/10 shadow-card overflow-hidden h-[calc(100vh-210px)] min-h-[520px] flex">
                <aside className={`${mobilePane === "list" ? "flex" : "hidden"} md:flex w-full md:w-[320px] border-r border-navy/10 flex-col`}>
                    <div className="px-4 py-3 border-b border-navy/10 bg-white">
                        <h2 className="text-sm font-semibold text-navy">Conversations</h2>
                        <p className="text-xs text-slate mt-0.5">
                            {loadingContacts ? "Chargement des contacts..." : `${filteredConversations.length} / ${contacts.length} contact(s)`}
                        </p >
                        <div className="mt-2 relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher un utilisateur..."
                                className="w-full rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm text-navy placeholder:text-slate outline-none focus:border-teal/40 focus:ring-2 focus:ring-teal/15"
                            />
                        </div>
                    </div >
                    <div className="flex-1 overflow-y-auto">
                        <ConversationList
                            conversations={filteredConversations}
                            activeConversationId={activeConversationId}
                            onSelect={handleSelectConversation}
                        />
                    </div>
                </aside >

                <section className={`${mobilePane === "chat" ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0`}>
                    <ChatHeader
                        activeConversation={activeConversation}
                        status={connectionStatus}
                        onRefresh={() => refreshActiveConversation()}
                        onBack={() => setMobilePane("list")}
                    />
                    {error && (
                        <div className="mx-4 mt-3 rounded-xl border border-coral/20 bg-coral/10 px-3 py-2 text-coral text-sm">
                            {error}
                        </div>
                    )}
                    {loadingHistory && (
                        <div className="mx-4 mt-3 rounded-xl border border-gold/20 bg-gold/10 px-3 py-2 text-gold text-sm">
                            Chargement de l'historique...
                        </div>
                    )}
                    <MessageList messages={activeMessages} />
                    <MessageInput
                        disabled={!activeConversationId}
                        onSend={sendMessage}
                    />
                </section>
            </div >
        </div >
    );
}
