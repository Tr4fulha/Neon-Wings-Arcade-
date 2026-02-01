
type Factory<T> = () => T;
type Reset<T> = (item: T) => void;

export class ObjectPool<T extends { active: boolean }> {
    private pool: T[] = [];
    private factory: Factory<T>;
    
    // Opcional: Função de reset padrão
    private resetFn?: Reset<T>;

    constructor(factory: Factory<T>, initialSize: number, resetFn?: Reset<T>) {
        this.factory = factory;
        this.resetFn = resetFn;

        for (let i = 0; i < initialSize; i++) {
            const item = this.factory();
            item.active = false;
            this.pool.push(item);
        }
    }

    /**
     * Obtém um objeto da piscina ou cria um novo se estiver vazia.
     * O objeto retornado terá active = true.
     */
    public get(): T {
        let item = this.pool.pop();
        if (!item) {
            item = this.factory();
        }
        
        item.active = true;
        if (this.resetFn) {
            this.resetFn(item);
        }
        return item;
    }

    /**
     * Devolve um objeto para a piscina para ser reutilizado futuramente.
     */
    public release(item: T) {
        item.active = false;
        this.pool.push(item);
    }
}
