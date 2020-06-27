import React, { Component } from "react";
import "./ChatList.css";

class Meeting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      selectedUserId: null,
      chatListUsers: [],
    };
  }

  join = () => {
    var id = window.prompt("Enter Meeting Id");
    var userid = localStorage.getItem("username");
    window.open(
      `http://localhost:3000/meeting?name=${userid}&room=${id}`,
      "_blank"
    );
  };

  render() {
    return (
      <center>
        <button className="btn btn-success my-2" onClick={this.join}>
          Join Meeting
        </button>
        <br />
        <button className="btn btn-primary my-2" onClick={this.create}>
          Create Meeting
        </button>
      </center>
    );
  }
}

export default Meeting;
