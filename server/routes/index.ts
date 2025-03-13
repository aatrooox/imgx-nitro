export default defineEventHandler((event) => {
  if (handleCors(event, { origin: "*" })) {
    return;
  }

  if (event.method === 'OPTIONS') {
    return ""
  }
  
  return "zzclub base server (template) is running ...";
});
