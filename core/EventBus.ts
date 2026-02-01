
type Callback<T = any> = (data: T) => void;

export class EventBus {
    private listeners: Record<string, Callback[]> = {};

    /**
     * Inscreve-se em um evento.
     * Retorna uma função para cancelar a inscrição.
     */
    on<T>(event: string, callback: Callback<T>): () => void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        
        return () => {
            if (!this.listeners[event]) return;
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        };
    }

    /**
     * Emite um evento com dados opcionais.
     */
    emit<T>(event: string, data?: T) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
    
    /**
     * Limpa todos os listeners (útil ao destruir o jogo)
     */
    clear() {
        this.listeners = {};
    }
}
