import React, { Component } from "react";
import { Tabs, Tab } from "react-bootstrap";

import Login from "./login/Login";
import Registration from "./registration/Registration";

import "./Authentication.css";

class Authentication extends Component {
  state = {
    loadingState: false,
  };

  setRenderLoadingState = (loadingState) => {
    this.setState({
      loadingState: loadingState,
    });
  };

  render() {
    return (
      <div className="container">
        <div
          className={`overlay auth-loading ${
            this.state.loadingState ? "" : "visibility-hidden"
          }`}
        >
          <h1>Loading</h1>
        </div>
        <div className="row">
          <div
            className="col-md-9 col-lg-7 col-sm-11 col-xs-11 p-4 card"
            style={{ margin: "5% auto" }}
          >
            <div className="row">
              <div className="col-md-9 col-lg-9 col-sm-12 col-xs-12 m-auto py-4">
                <h1 className="text-center display-2 text-primary mb-2">
                  LOGO
                </h1>
                {/* <img src="https://rahulshomemca.github.io/LOGO.png" className="img-fluid mx-auto d-block"/> */}
                <Tabs defaultActiveKey="login">
                  <Tab eventKey="login" title="Login">
                    <Login loadingState={this.setRenderLoadingState} />
                  </Tab>
                  <Tab eventKey="registration" title="Register">
                    <Registration loadingState={this.setRenderLoadingState} />
                  </Tab>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Authentication;
