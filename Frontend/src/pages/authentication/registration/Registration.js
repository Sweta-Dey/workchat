import React, { Component } from "react";
import { Alert, Form, Button } from "react-bootstrap";
import { withRouter } from "react-router-dom";
import { DebounceInput } from "react-debounce-input";
import { storage } from "../../../firebase";

import ChatHttpServer from "../../../utils/chatHttpServer";
import "./Registration.css";

class Registration extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      username: "",
      designation: "",
      password: "",
      confirmpassword: "",
      file: null,
      image: null,
      url: "",
      progress: 0,
      usernameAvailable: true,
    };
  }

  handleRegistration = async (event) => {
    event.preventDefault();
    this.props.loadingState(true);
    try {
      if (
        this.state.password !== "" &&
        this.state.confirmpassword === this.state.password
      ) {
        const { image } = this.state;
        const uploadTask = storage.ref(`profile/${image.name}`).put(image);
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // progress function ...
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            this.setState({ progress });
            console.log(progress);
          },
          (error) => {
            // Error function ...
            console.log(error);
          },
          () => {
            // complete function ...
            storage
              .ref("profile")
              .child(image.name)
              .getDownloadURL()
              .then(async (url) => {
                console.log(url);
                this.setState({ url, progress: 0, visible: false });
                const response = await ChatHttpServer.register(this.state);
                this.props.loadingState(false);
                if (response.error) {
                  alert("Unable to register, try after some time.");
                } else {
                  ChatHttpServer.setLS("userid", response.userId);
                  this.props.history.push(`/home`);
                }
              });
          }
        );
      } else {
        this.props.loadingState(false);
        alert("Both password should match");
      }
    } catch (error) {
      this.props.loadingState(false);
      alert("Unable to register, try after some time.");
    }
  };

  checkUsernameAvailability = async (event) => {
    if (event.target.value !== "" && event.target.value !== undefined) {
      this.setState({
        username: event.target.value,
      });
      //this.props.loadingState(true);
      try {
        const response = await ChatHttpServer.checkUsernameAvailability(
          this.state.username
        );
        this.props.loadingState(false);
        if (response.error) {
          this.setState({
            usernameAvailable: false,
          });
        } else {
          this.setState({
            usernameAvailable: true,
          });
        }
      } catch (error) {
        this.props.loadingState(false);
        this.setState({
          usernameAvailable: false,
        });
      }
    } else if (event.target.value === "") {
      this.setState({
        usernameAvailable: true,
      });
    }
  };

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  uploadImage = (e) => {
    if (e.target.files[0]) {
      const image = e.target.files[0];
      this.setState({
        image,
        file: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  render() {
    return (
      <Form className="auth-form">
        <Form.Group controlId="formName">
          <Form.Control
            type="text"
            name="name"
            placeholder="Enter Name"
            onChange={this.handleInputChange}
          />
        </Form.Group>
        <Form.Group controlId="formUsername">
          <DebounceInput
            className="form-control"
            placeholder="Enter username"
            minLength={2}
            debounceTimeout={300}
            onChange={this.checkUsernameAvailability}
          />
          <Alert
            className={{
              "username-availability-warning": true,
              "visibility-hidden": this.state.usernameAvailable,
            }}
            variant="danger"
          >
            <strong>{this.state.username}</strong> is already taken, try another
            username.
          </Alert>
        </Form.Group>
        <Form.Group controlId="formDesignation">
          <Form.Control
            type="text"
            name="designation"
            placeholder="Enter Designation"
            onChange={this.handleInputChange}
          />
        </Form.Group>
        <Form.Group controlId="formPassword">
          <Form.Control
            type="password"
            name="password"
            placeholder="Password"
            onChange={this.handleInputChange}
          />
        </Form.Group>
        <Form.Group controlId="formPasswordConfirm">
          <Form.Control
            type="password"
            name="confirmpassword"
            placeholder="Confirm Password"
            onChange={this.handleInputChange}
          />
        </Form.Group>
        <div className="custom-file">
          <input
            type="file"
            className="custom-file-input"
            accept="image/*"
            id="customFile"
            onChange={this.uploadImage}
          />
          <label className="custom-file-label" htmlFor="customFile">
            Choose Profile Picture
          </label>
        </div>
        <Button
          variant="primary"
          type="submit"
          onClick={this.handleRegistration}
          block
          size="lg"
          style={{ marginTop: "15px" }}
        >
          REGISTER
        </Button>
      </Form>
    );
  }
}

export default withRouter(Registration);
