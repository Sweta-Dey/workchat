import React, { Component } from "react";
import Modal from "react-awesome-modal";

import ChatHttpServer from "../../../utils/chatHttpServer";
import ChatSocketServer from "../../../utils/chatSocketServer";
import moment from "moment";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import { storage } from "../../../firebase";
import axios from "axios";
import swal from 'sweetalert';

import "./Conversation.css";

const languages = [
  { id: 1, lang: "English", key: "en" },
  { id: 2, lang: "Chineese", key: "zh-cn" },
  { id: 3, lang: "Japneese", key: "jp" },
  { id: 4, lang: "Spanish", key: "sp" },
  { id: 5, lang: "Hindi", key: "hi" },
  { id: 6, lang: "Bengali", key: "bn" },
  { id: 7, lang: "Kannada", key: "kn" }
];

class Conversation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "",
      messageLoading: true,
      conversations: [],
      selectedUser: null,
      showPicker: false,
      visible: false,
      file: null,
      image: null,
      url: "",
      progress: 0,
      language: "EN",
    };
    this.messageContainer = React.createRef();
  }

  componentDidMount() {
    ChatSocketServer.receiveMessage();
    ChatSocketServer.eventEmitter.on(
      "add-message-response",
      this.receiveSocketMessages
    );
  }

  componentWillUnmount() {
    ChatSocketServer.eventEmitter.removeListener(
      "add-message-response",
      this.receiveSocketMessages
    );
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.newSelectedUser === null ||
      this.props.newSelectedUser.id !== prevProps.newSelectedUser.id
    ) {
      this.getMessages();
    }
  }

  openModal() {
    this.setState({
      visible: true,
    });
  }

  closeModal() {
    this.setState({
      visible: false,
    });
  }

  suggestList = () => {
    let sugg = [];
    this.state.conversations.map((con) =>
      !sugg.includes(con.message) && con.type === "text"
        ? sugg.push(con.message)
        : null
    );
    return sugg;
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.selectedUser === null ||
      state.selectedUser.id !== props.newSelectedUser.id
    ) {
      return {
        selectedUser: props.newSelectedUser,
      };
    }
    return null;
  }

  receiveSocketMessages = (socketResponse) => {
    const { selectedUser } = this.state;
    console.log(this.props.newSelectedUser.type);
    console.log(socketResponse.chattype);
    if (
      selectedUser !== null &&
      ((selectedUser.id === socketResponse.fromUserId &&
        socketResponse.chattype === "user") ||
        (socketResponse.chattype === "meeting" &&
          this.props.newSelectedUser.type === "meeting" &&
          socketResponse.fromUserId !== this.props.userId))
    ) {
      this.setState({
        conversations: [...this.state.conversations, socketResponse],
      });
      this.scrollMessageContainer();
    }
  };

  getMessages = async () => {
    try {
      const { userId, newSelectedUser } = this.props;
      const messageResponse = await ChatHttpServer.getMessages(
        userId,
        newSelectedUser.id,
        newSelectedUser.type
      );
      if (!messageResponse.error) {
        this.setState({
          conversations: messageResponse.messages,
        });
        this.scrollMessageContainer();
      } else {
        alert("Unable to fetch messages");
      }
      this.setState({
        messageLoading: false,
      });
    } catch (error) {
      this.setState({
        messageLoading: false,
      });
    }
  };

  sendMessage = (event) => {
    if (event.key === "Enter") {
      const message = event.target.value;
      const { userId, newSelectedUser } = this.props;
      if (message === "" || message === undefined || message === null) {
        alert(`Message can't be empty.`);
      } else if (userId === "") {
        this.router.navigate(["/"]);
      } else if (newSelectedUser === undefined) {
        alert(`Select a user to chat.`);
      } else {
        this.sendAndUpdateMessages({
          fromUserId: userId,
          message: message.trim(),
          toUserId: newSelectedUser.id,
          type: "text",
          messagetime: Date.now(),
          username: this.props.username,
          chattype: this.props.newSelectedUser.type,
        });
        this.setState({
          text: "",
          language: "en",
          showPicker: false,
        });
      }
    }
  };

  sendNow = () => {
    if (this.state.text !== "") {
      this.sendAndUpdateMessages({
        fromUserId: this.props.userId,
        message: this.state.text.trim(),
        toUserId: this.props.newSelectedUser.id,
        type: "text",
        messagetime: Date.now(),
        username: this.props.username,
        chattype: this.props.newSelectedUser.type,
      });
      this.setState({
        text: "",
        language: "en",
        showPicker: false,
      });
    } else {
      alert("Message can't be empty.");
    }
  };

  sendAndUpdateMessages(message) {
    try {
      ChatSocketServer.sendMessage(message);
      this.setState({
        conversations: [...this.state.conversations, message],
      });
      this.scrollMessageContainer();
    } catch (error) {
      alert(`Can't send your message`);
    }
  }

  scrollMessageContainer() {
    if (this.messageContainer.current !== null) {
      try {
        setTimeout(() => {
          this.messageContainer.current.scrollTop = this.messageContainer.current.scrollHeight;
        }, 100);
      } catch (error) {
        console.warn(error);
      }
    }
  }

  alignMessages(toUserId) {
    const { userId } = this.props;
    return userId !== toUserId;
  }

  onImgLoad = ({ target: img }) => {
    this.scrollMessageContainer();
  };

  getMessageUI() {
    return (
      <div ref={this.messageContainer} className="message-thread">
        {this.state.conversations.map((conversation, index) => (
          <React.Fragment key={index}>
            <div
              className={`${
                !this.alignMessages(conversation.fromUserId)
                  ? "align-right"
                  : ""
              }`}
            >
              {conversation.type === "image" ? (
                <>
                  <img
                    src={conversation.message}
                    className="img-fluid"
                    width="100%"
                    alt={conversation.message}
                    onLoad={this.onImgLoad}
                  />
                  <a
                    href={conversation.message}
                    target="_blank"
                    className="text-white"
                    rel="noopener noreferrer"
                    style={{textDecoration: 'none'}}
                  >
                    <br/> <small>{conversation.filename} {" "} <i class="fas fa-file-download"></i></small>
                  </a>
                </>
              ) : conversation.type === "media" ? (
                <a
                  href={conversation.message}
                  target="_blank"
                  className="text-white"
                  rel="noopener noreferrer"
                  style={{textDecoration: 'none'}}
                >
                  <small>{conversation.filename} {" "} <i class="fas fa-file-download"></i></small>
                </a>
              ) : (
                conversation.message
              )}
              <br />
            </div>
            <span
              style={{ fontSize: "10px" }}
              className={`message-thread-span ${
                !this.alignMessages(conversation.fromUserId)
                  ? "align-right-span"
                  : ""
              }`}
            >
              {this.props.newSelectedUser.type === "meeting" &&
              this.alignMessages(conversation.fromUserId) ? (
                <>
                  - {conversation.username} <br />
                </>
              ) : null}
              {moment(conversation.messagetime).format(
                "MMMM Do YYYY, h:mm:ss a"
              )}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  }

  getInitiateConversationUI() {
    if (this.props.newSelectedUser !== null) {
      return (
        <div className="message-thread start-chatting-banner">
          <p className="heading">
            Start chatting with {this.props.newSelectedUser.username} 
            <span className="sub-heading"
              style={{cursor: 'pointer'}}
              onClick={() => this.setState({text: 'Hi'})}
            > Say Hi.</span>
          </p>
        </div>
      );
    }
  }

  handleChange = (e) => {
    this.setState({ text: e.target.value });
  };

  addEmoji = (e) => {
    let emoji = e.native;
    this.setState({
      text: this.state.text + emoji,
    });
  };

  fileChoose = () => {
    document.getElementById("fileInput").click();
  };

  uploadImage = (e) => {
    if (e.target.files[0]) {
      const image = e.target.files[0];
      this.setState({
        image,
        file: URL.createObjectURL(e.target.files[0]),
      });
      this.openModal();
      return;
    }
  };

  saveImage = () => {
    const { image } = this.state;
    const uploadTask = storage.ref(`images/${image.name}`).put(image);
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
          .ref("images")
          .child(image.name)
          .getDownloadURL()
          .then((url) => {
            console.log(url);
            this.setState({ url, progress: 0, visible: false });
            this.sendAndUpdateMessages({
              fromUserId: this.props.userId,
              message: url.trim(),
              type: "image",
              filename: image.name,
              toUserId: this.props.newSelectedUser.id,
              messagetime: Date.now(),
              username: this.props.username,
              chattype: this.props.newSelectedUser.type,
            });
          });
      }
    );
  };

  ToggleEmoji = () => {
    this.setState({ showPicker: !this.state.showPicker });
  };

  getMedia = () => {
    document.getElementById("mediaInput").click();
  };

  uploadMedia = (e) => {
    var size = e.target.files[0].size / 1000;
    var media = e.target.files[0];
    if (size <= 5000) {
      const uploadTask = storage.ref(`media/${media.name}`).put(media);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // progress function ...
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          this.setState({ progress });
          swal({
            title: "Sending File!",
            text: `Uploaded (${progress} %)`,
            buttons: false
          });
          console.log(progress);
        },
        (error) => {
          // Error function ...
          console.log(error);
        },
        () => {
          // complete function ...
          storage
            .ref("media")
            .child(media.name)
            .getDownloadURL()
            .then((url) => {
              console.log(url);
              this.setState({ url, progress: 0, visible: false });
              swal.close();
              this.sendAndUpdateMessages({
                fromUserId: this.props.userId,
                message: url.trim(),
                type: "media",
                toUserId: this.props.newSelectedUser.id,
                messagetime: Date.now(),
                filename: media.name,
                username: this.props.username,
                chattype: this.props.newSelectedUser.type,
              });
            })
            .catch((err) => console.log(err));
        }
      );
    } else {
      alert("Maximum file size 5MB");
    }
  };

  langChange = (lang) => {
    var link = `https://translation.googleapis.com/language/translate/v2?key=AIzaSyD5qPAzbaCqYp_h7n2EkCOQEZe4wygqcAM&source=${this.state.language}&target=${lang.key}&q=${this.state.text}`;

    axios
      .get(link)
      .then((data) =>
        this.setState({
          text: data.data.data.translations[0].translatedText,
          language: lang.key,
        })
      )
      .catch((err) => console.log(err));
  };

  render() {
    const { messageLoading, selectedUser } = this.state;
    return (
      <>
        <div
          className={`message-overlay ${
            !messageLoading ? "visibility-hidden" : ""
          }`}
        >
          <h3>
            {" "}
            {selectedUser !== null && selectedUser.username
              ? "Loading Messages"
              : <h1 className="display-2">WORK CHAT</h1>}
          </h3>
        </div>
        <div
          className={`message-wrapper ${
            messageLoading ? "visibility-hidden" : ""
          }`}
        >
          <div className="message-container">
            <div className="bg-white shadow p-3 text-secondary">
              To:{" "}
              {this.props.newSelectedUser !== null
                ? this.props.newSelectedUser.username
                : "----"}
              <span className="float-right">
                <div className="dropdown">
                  <button
                    type="button"
                    className="btn dropdown-toggle btn-sm"
                    data-toggle="dropdown"
                  >
                    Lang({this.state.language})
                  </button>
                  <div className="dropdown-menu">
                    {languages.map((lg) => (
                      <React.Fragment key={lg.key}>
                        {this.state.language !== lg.key && (
                          <a
                            className="dropdown-item"
                            href={`#${lg.key}`}
                            key={lg.id}
                            onClick={() => this.langChange(lg)}
                          >
                            {lg.lang}
                          </a>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </span>
            </div>
            {this.state.conversations.length > 0
              ? this.getMessageUI()
              : this.getInitiateConversationUI()}
          </div>

          <div className="message-typer shadow">
            <br />
            {this.state.showPicker && (
              <span>
                <Picker
                  title="Pick your emoji…"
                  onSelect={this.addEmoji}
                  style={{ position: "absolute", bottom: "8vh", left: 0 }}
                />
              </span>
            )}

            <input
              className="message form-control textarea"
              placeholder="Type your message"
              value={this.state.text}
              onChange={this.handleChange}
              onKeyPress={this.sendMessage}
              list="text"
            />
            {this.state.text.length > 0 && (
              <datalist id="text">
                {this.suggestList().map((data, i) => (
                  <React.Fragment key={data}>
                    {this.state.text.length > 1 ? (
                      <option value={data}>{data}</option>
                    ) : null}
                  </React.Fragment>
                ))}
              </datalist>
            )}
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={this.uploadImage}
            />
            <input
              id="mediaInput"
              type="file"
              style={{ display: "none" }}
              onChange={this.uploadMedia}
            />
            <button
              onClick={this.ToggleEmoji}
              style={{ float: "left" }}
              className="button btn bg-white"
            >
              <i className="far fa-smile"></i>
            </button>
            <button
              onClick={this.fileChoose}
              style={{ float: "left" }}
              className="button2 btn bg-white"
            >
              <i className="far fa-image"></i>
            </button>
            <button
              onClick={this.getMedia}
              style={{ float: "right" }}
              className="button3 btn bg-white"
            >
              <i className="fas fa-paperclip"></i>
            </button>
            <button
              style={{ float: "right" }}
              className="button4 btn bg-white"
              onClick={this.sendNow}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
        <Modal
          visible={this.state.visible}
          width="450"
          height="450"
          effect="fadeInUp"
          onClickAway={() => this.closeModal()}
        >
          <div className="p-3">
            <p>Selected Image</p>
            <img
              src={this.state.file}
              className="rounded img-fluid"
              alt="send"
              style={{ maxHeight: "300px", maxWidth: "400px" }}
            ></img>
            <br />
            <button
              className="btn btn-outline-danger my-4 mx-1"
              onClick={() => this.setState({ visible: false })}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary my-4 mx-1"
              onClick={this.saveImage}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
            {this.state.progress > 0 && (
              <span>Uploading.. {this.state.progress} %</span>
            )}
          </div>
        </Modal>
      </>
    );
  }
}

export default Conversation;
