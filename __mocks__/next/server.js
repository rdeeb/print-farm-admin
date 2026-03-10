module.exports = {
  NextResponse: {
    json: (data, init = {}) => ({
      status: init.status ?? 200,
      json: () => Promise.resolve(data),
    }),
  },
}
