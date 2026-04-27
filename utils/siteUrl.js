const dev = "http://localhost:3000";
const prod = "https://www.meepletron.com";
export const siteUrl = process.env.NODE_ENV !== "production" ? dev : prod;
