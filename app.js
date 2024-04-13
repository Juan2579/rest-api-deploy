const express = require("express")
const crypto = require("node:crypto")
const cors = require("cors")

const { validateMovie, validatePartialMovie } = require("./schemas/movies.js")
const movies = require("./movies.json")

const app = express()
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      "http://localhost:8080",
      "http://localhost:1234",
      "https://movies.com",
    ]

    if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
      return callback(null, true)
    }

    return callback(new Error("Not allowed by CORS"))
  }
}))
app.use(express.json())
app.disable("x-powered-by")

// metodos normales: GET/HEAD/POST
//metodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight

// todos los recursos que sean MOVIES se identifican con /movies



app.get("/movies", (req, res) => {
  // const origin = req.headers.origin

  

  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()))

    return res.json(filteredMovies)

  }
  res.json(movies)
})

app.get("/movies/:id", (req, res) => { //path-to-regexp
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if(movie) return res.json(movie)

  res.status(404).json({ message: "Movie not found" })
})

app.post("/movies", (req, res) => {

  const result = validateMovie(req.body)

  if (result.error) {
    // 422
    return res.status(400).json({ error: JSON.parse(result.error.message)})
  }


  const newMovie = {
    id: crypto.randomUUID(), //uuid v4
    ...result.data
  }

  // Esto no seria REST porque estamos guardadno el estado de la aplicacion en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie) //actualizar cache del cliente
})

app.delete("/movies/:id", (req, res) => {
  // const origin = req.headers.origin

  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //   res.header("Access-Control-Allow-Origin", origin)
  // }
  const { id } = req.params

  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: "Movie deleted"})
})

app.patch("/movies/:id", (req, res) => {
  const result = validatePartialMovie(req.body)

  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message)})
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" })
  }

  const updatedMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updatedMovie

  res.json(updatedMovie)
})

// app.options("/movies/:id", (req, res) => {
//   const origin = req.headers.origin

//   if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
//     res.header("Access-Control-Allow-Origin", origin)
//     res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE")
//   }
//   res.send(200)
// })

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`)
})