import * as bcrypt from 'bcrypt';
export class PasswordHash {
    static async hashPassword(password: string): Promise<string> {  
        // Implement a secure hashing algorithm like bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    }
    static async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}