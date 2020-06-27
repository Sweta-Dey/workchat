/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import { withRouter } from "react-router-dom";

import ChatSocketServer from "../../utils/chatSocketServer";
import ChatHttpServer from "../../utils/chatHttpServer";

import ChatList from "./chat-list/ChatList";
import Conversation from "./conversation/Conversation";

import "./Home.css";

class Home extends Component {
  userId = null;
  state = {
    isOverlayVisible: true,
    username: "______",
    name: "",
    image_url: "",
    designation: "",
    selectedUser: null,
  };

  logout = async () => {
    try {
      await ChatHttpServer.removeLS();
      ChatSocketServer.logout({
        userId: this.userId,
      });
      ChatSocketServer.eventEmitter.on("logout-response", (loggedOut) => {
        this.props.history.push(`/`);
      });
    } catch (error) {
      console.log(error);
      alert(" This App is Broken, we are working on it. try after some time.");
      throw error;
    }
  };

  setRenderLoadingState = (loadingState) => {
    this.setState({
      isOverlayVisible: loadingState,
    });
  };

  async componentDidMount() {
    try {
      this.setRenderLoadingState(true);
      this.userId = await ChatHttpServer.getUserId();
      const response = await ChatHttpServer.userSessionCheck(this.userId);
      if (response.error) {
        this.props.history.push(`/`);
      } else {
        this.setState({
          username: response.username,
          name: response.name,
          designation: response.designation,
          image_url: response.image_url,
        });
        ChatHttpServer.setLS("username", response.username);
        ChatSocketServer.establishSocketConnection(this.userId);
      }
      this.setRenderLoadingState(false);
    } catch (error) {
      this.setRenderLoadingState(false);
      this.props.history.push(`/`);
    }
  }

  updateSelectedUser = (user) => {
    this.setState({
      selectedUser: user,
    });
  };

  getChatListComponent() {
    return this.state.isOverlayVisible ? null : (
      <ChatList
        userId={this.userId}
        updateSelectedUser={this.updateSelectedUser}
        type="user"
      />
    );
  }

  getChatListGroupComponent() {
    return this.state.isOverlayVisible ? null : (
      <ChatList
        userId={this.userId}
        updateSelectedUser={this.updateSelectedUser}
        type="meeting"
      />
    );
  }

  getChatBoxComponent = () => {
    return this.state.isOverlayVisible ? null : (
      <Conversation
        userId={this.userId}
        username={this.state.name}
        newSelectedUser={this.state.selectedUser}
      />
    );
  };

  render() {
    return (
      <>
        <div
          className={`${
            this.state.isOverlayVisible ? "overlay" : "visibility-hidden"
          } `}
        >
          <h1>Loading</h1>
        </div>

        <div className="container-fluid">
          <div
            className="row"
            style={{
              height: "100vh",
              maxHeight: "100vh",
              overflowY: "scroll",
              overflowX: "hidden",
            }}
          >
            <div
              className="col-lg-3 col-md-3 col-sm-12 col-xs-12 p-0 m-0 bg-dark shadow-lg"
              style={{ overflowY: "scroll", overflowX: "hidden" }}
            >
              <div className="border-bottom">
                <div className="row bg-light px-3 py-1 shadow text-secondary">
                  <div className="col-2">
                    <img
                      src={this.state.image_url}
                      alt={this.state.image_url}
                      style={{
                        borderRadius: "50%",
                        marginRight: "10px",
                        marginTop: "4px",
                        width: "40px",
                      }}
                      className="rounded mx-auto d-block"
                    />
                  </div>
                  <div className="col-7 float-left">
                    {this.state.name}
                    <br />
                    <small>{this.state.designation}</small>
                  </div>
                  <div className="col-2">
                    <button
                      className="btn btn-outline-primary"
                      style={{
                        position: "absolute",
                        right: "-10px",
                        top: "5px",
                        borderRadius: "50% !important",
                      }}
                      onClick={this.logout}
                    >
                      <i className="fas fa-sign-out-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-light px-4 pt-4">List of Users and Groups</p>
              {this.getChatListComponent()}
            </div>
            <div
              className="col-lg-9 col-md-9 col-sm-12 col-xs-12 p-0 m-0"
              style={{
                overflowY: "scroll",
                overflowX: "hidden",
                height: "100vh",
                maxHeight: "100vh",
              }}
            >
              {this.getChatBoxComponent()}
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(Home);
