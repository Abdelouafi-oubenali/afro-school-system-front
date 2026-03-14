declare module "sockjs-client/dist/sockjs" {
    export default class SockJS {
        constructor(url: string, _reserved?: unknown, options?: unknown);
        close(code?: number, reason?: string): void;
        send(data: string): void;
        onopen: ((event: Event) => void) | null;
        onmessage: ((event: MessageEvent) => void) | null;
        onclose: ((event: CloseEvent) => void) | null;
        onerror: ((event: Event) => void) | null;
    }
}
