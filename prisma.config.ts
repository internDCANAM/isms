import 'dotenv/config';
import {defineConfig} from 'prisma/config';

const {DATABASE_URL} = process.env;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  ...(DATABASE_URL ? {datasource: {url: DATABASE_URL}} : {}),
});
