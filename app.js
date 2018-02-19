// this example uses express web framework so we know what longer build times
// do and how Dockerfile layer ordering matters. If you mess up Dockerfile ordering
// you'll see long build times on every code change + build. If done correctly,
// code changes should be only a few seconds to build locally due to build cache.
const express = require("express");

const morgan = require("morgan");
// morgan provides easy logging for express, and by default it logs to stdout
// do app logging to files in containers.

const port = process.env.PORT || 8080;
// if you're not using docker-compose for local development, this will default to 8080
// to prevent non-root permission problems with 80. Dockerfile is set to make this 80
// because containers don't have that issue :)

const app = express();

//simple middleware for morgan
app.use(morgan("common"));

app.get("/", (req, res) => {
  res.send("Hello from a node app inside of Docker");
});

app.get("/healthz", (req, res) => {
	// do app logic here to determine if app is truly healthy
	// you should return 200 if healthy, and anything else will fail
  res.send('I am happy and healthy\n');
});

const server = app.listen(port, () => {
  console.log("Server is now listening for connections")
});

//
// need this in docker container to properly exit since node doesn't handle SIGINT/SIGTERM
// this also won't work on using npm start since:
// https://github.com/npm/npm/issues/4603
// https://github.com/npm/npm/pull/10868
// https://github.com/RisingStack/kubernetes-graceful-shutdown-example/blob/master/src/index.js
// if you want to use npm then start with `docker run --init` to help, but I still don't think it's
// a graceful shutdown of node process
//

// quit on ctrl-c when running docker in terminal
process.on('SIGINT', function onSigint () {
	console.info('Got SIGINT (aka ctrl-c in docker). Graceful shutdown ', new Date().toISOString());
  shutdown();
});

// quit properly on docker stop
process.on('SIGTERM', function onSigterm () {
  console.info('Got SIGTERM (docker container stop). Graceful shutdown ', new Date().toISOString());
  shutdown();
})

// shut down server
function shutdown() {
  server.close(function onServerClosed (err) {
    if (err) {
      console.error(err);
      process.exitCode = 1;
		}
		process.exit();
  })
}
//
// need above in docker container to properly exit
//