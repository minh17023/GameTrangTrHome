import MovieRepository from '../repositories/MovieRepository.js';

class MovieService {
  async getMovies() {
    return await MovieRepository.getAllMovies();
  }

  async addMovie(title, time, date) {
    if (!title || !time || !date) throw new Error('Vui lòng nhập đủ thông tin vé phim');
    return await MovieRepository.addMovie(title, time, date);
  }

  async updateMovie(id, title, time, date) {
    if (!title || !time || !date) throw new Error('Vui lòng nhập đủ thông tin vé phim');
    return await MovieRepository.updateMovie(id, title, time, date);
  }

  async deleteMovie(id) {
    return await MovieRepository.deleteMovie(id);
  }
}

export default new MovieService();
