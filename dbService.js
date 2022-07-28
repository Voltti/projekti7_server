const { Pool } = require("pg");
const dotenv = require("dotenv");
const e = require("express");
let instance = null;
dotenv.config();

const pool = new Pool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DB_PORT,
});

class DbService {
  static getDbServiceInstance() {
    return instance ? instance : new DbService();
  }

  async getAllData() {
    // console.log("Testing connection");
    const client = await pool.connect();
    try {
      const res = await client.query("SELECT * FROM names", []);
      // console.log("Tiedot haettu tietokannasta: ", res);
      return res.rows;
    } catch (e) {
      console.log("Hakuvirhe!");
      throw e;
    } finally {
      client.release();
    }
  }

  async insertNewName(name) {
    const client = await pool.connect();
    try {
      const dateAdded = new Date();
      let res = await client.query(
        "INSERT INTO names (name, date_added) VALUES ($1,$2)",
        [name, dateAdded]
      );
      res = await client.query(
        "SELECT id FROM names WHERE name = $1 AND date_added = $2",
        [name, dateAdded]
      );
      const insertId = res.rows[0].id;
      return {
        id: insertId,
        name: name,
        dateAdded: dateAdded,
      };
    } catch (e) {
      console.log("Syöttövirhe: e");
      throw e;
    } finally {
      client.release();
    }
  }

  async deleteRowById(id) {
    const client = await pool.connect();
    try {
      id = parseInt(id, 10);
      const res = await client.query("DELETE FROM names WHERE id = $1", [id]);
      return Boolean(res.rowCount);
    } catch (e) {
      console.log("Virhe: ", e);
      return false;
    } finally {
      client.release();
    }
  }

  async updateNameById(id, name) {
    const client = await pool.connect();
    try {
      id = parseInt(id, 10);
      const res = await client.query(
        "UPDATE names SET name = $1 WHERE id = $2",
        [name, id]
      );
      return Boolean(res.rowCount);
    } catch (e) {
      console.log("Virhe: ", e);
      return false;
    } finally {
      client.release();
    }
  }

  async searchByName(name) {
    const client = await pool.connect();
    if (name == "") return this.getAllData();
    try {
      const res = await client.query("SELECT * FROM names WHERE name = $1", [
        name,
      ]);
      return res.rows;
    } catch (e) {
      console.log("Virhe: ", e);
      throw e;
    } finally {
      client.release();
    }
  }

  async _OldsearchByName(name) {
    try {
      const response = await new Promise((resolve, reject) => {
        const query = "SELECT * FROM names WHERE name = $1;";

        client.query(query, [name], (err, results) => {
          if (err) reject(new Error(err.message));
          resolve(results);
        });
      });

      return response;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = DbService;
