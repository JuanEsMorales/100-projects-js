onmessage = async ({ data }) => {
  const { code, data: globalCode, duration } = data

  let result
  try {
    result = await eval(`
      (async () => {
        let PERF__ops = 0;
        let PERF__ops__start = Date.now();
        let PERF__ops__end = Date.now() + ${duration};
        ${globalCode};

        while (Date.now() < PERF__ops__end) {
          ${code}
          PERF__ops++
        }
        return PERF__ops
      })()
    `)
  } catch (error) {
    console.error(error)
    return result = 0
  }
  
  postMessage(result)
}