const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "moviesData.db");

const app = express();
app.use(express.json());

let database = null;

const initializeServerAndDB = async (request, response) => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost/:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeServerAndDB();

const convertMovieListDBObjectToResponseObject = (movieListDBObject) => {
  return {
    movieName: movieListDBObject.movie_name,
  };
};

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT movie_name
    FROM movie;`;
  const moviesArray = await database.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) =>
      convertMovieListDBObjectToResponseObject(eachMovie)
    )
  );
});

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const postPlayerQuery = `
  INSERT INTO movie( director_id, movie_name, lead_actor )
  VALUES ('${directorId}', '${movieName}', '${leadActor}');`;
  await database.run(postPlayerQuery);
  response.send("Movie Successfully Added");
});

const getMovieDetailsQueryToResponseObject = (movieObject) => {
  return {
    movieId: movieObject.movie_id,
    directorId: movieObject.director_id,
    movieName: movieObject.movie_name,
    leadActor: movieObject.lead_actor,
  };
};

app.get("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const getMoviesQuery = `
  SELECT *
  FROM movie
  WHERE movie_id = ${movieId};`;
  const movie = await database.get(getMoviesQuery);
  response.send(getMovieDetailsQueryToResponseObject(movie));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const { movieId } = request.params;
  const movieUpdateQuery = `
    UPDATE
        movie
    SET
        director_id = ${directorId},
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
    WHERE
        movie_id = ${movieId};`;

  await database.run(movieUpdateQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
  DELETE FROM movie
  WHERE movie_id = ${movieId};`;
  await database.run(deleteMovieQuery);
  response.send("Movie Removed");
});

const directorObjectToResponseObject = (directorObject) => {
  return {
    directorId: directorObject.director_id,
    directorName: directorObject.director_name,
  };
};

app.get("/directors/", async (request, response) => {
  const getDirectorQuery = `
  SELECT *
  FROM director;`;
  const directorsArray = await database.all(getDirectorQuery);
  response.send(
    directorsArray.map((eachDirector) =>
      directorObjectToResponseObject(eachDirector)
    )
  );
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieByDirectorQuery = `
    SELECT
      movie_name
    FROM
      movie
    WHERE
      director_id='${directorId}';`;
  const moviesArray = await database.all(getMovieByDirectorQuery);
  response.send(
    moviesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

module.exports = app;
