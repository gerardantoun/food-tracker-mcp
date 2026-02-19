import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { idle_timeout: 20 });

export default sql;
