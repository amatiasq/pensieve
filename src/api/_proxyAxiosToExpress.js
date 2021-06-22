module.exports = function pipeAxiosToExpress(axiosPromise, req, res) {
  return axiosPromise.then(
    response => writeResponse(response, res),
    error =>
      error.response
        ? writeResponse(error.response, res)
        : console.error(error),
  );
};

function writeResponse(input, output) {
  for (const key in input.headers) {
    // eslint-disable-next-line no-prototype-builtins
    if (input.headers.hasOwnProperty(key)) {
      const element = input.headers[key];
      output.header(key, element);
    }
  }

  output.status(input.status);
  output.send(input.data);
  output.end();
}
