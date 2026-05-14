import { z } from 'zod';

const envSchema = z.object({
    VITE_API_BASE_URL: z.url().nonempty(),
});

export const config = envSchema.parse(import.meta.env);

console.log({ appEnv: config });
