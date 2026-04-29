export default defineEventHandler((event) => {
  return { admin: event.context.admin }
})
