
export class InputHandler {
    private keys: Set<string> = new Set();
    public joystick: { x: number, y: number } = { x: 0, y: 0 };
    public isFiring: boolean = false;

    constructor() {
        this.bind();
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        this.keys.add(e.key);
        if (e.key === ' ') this.isFiring = true;
    };

    private handleKeyUp = (e: KeyboardEvent) => {
        this.keys.delete(e.key);
        if (e.key === ' ') this.isFiring = false;
    };

    public bind() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    public unbind() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.keys.clear();
        this.isFiring = false;
        this.joystick = { x: 0, y: 0 };
    }

    public setJoystick(x: number, y: number) {
        this.joystick.x = x;
        this.joystick.y = y;
    }

    public setFiring(firing: boolean) {
        this.isFiring = firing;
    }

    public getState() {
        const keysObj: { [key: string]: boolean } = {};
        this.keys.forEach(k => keysObj[k] = true);
        
        return {
            keys: keysObj,
            joystick: this.joystick,
            fire: this.isFiring || this.keys.has(' ')
        };
    }
}
