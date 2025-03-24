// src/types/express.d.ts
import { User } from './user'; // Импортируйте ваш тип User, если он у вас есть

declare global {
  namespace Express {
    interface Request {
      user?: User; // Добавляем user в Request
    }
    interface Application {
      server?: any;  // добавляем свойство `server` с типом `any`
    }
  }
}