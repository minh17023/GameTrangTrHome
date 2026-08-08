import MovieService from '../services/MovieService.js';

class MovieController {
  async getMovies(req, res) {
    try {
      const data = await MovieService.getMovies();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async addMovie(req, res) {
    try {
      const { title, time, date } = req.body;
      const data = await MovieService.addMovie(title, time, date);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateMovie(req, res) {
    try {
      const { id } = req.params;
      const { title, time, date } = req.body;
      const data = await MovieService.updateMovie(id, title, time, date);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteMovie(req, res) {
    try {
      const { id } = req.params;
      await MovieService.deleteMovie(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new MovieController();
