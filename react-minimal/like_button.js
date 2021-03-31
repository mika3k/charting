'use strict'


class LikeButton extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      liked: false,
    }
  }

  render() {
    if(this.state.liked) {
      return 'You liked this ' + `(${this.props.comment})`
    }

    return React.createElement(
      'button',                                           // element
      { onClick : () => this.setState({ liked: true }) }, // props
      'Like'                                              // children
    )
  }
}

// const domContainer = document.querySelector('#like_button_container')
// ReactDOM.render(React.createElement(LikeButton), domContainer)

document.querySelectorAll('.like_button_container')
  .forEach(element => {
    const comment = element.dataset.myComment
    ReactDOM.render(React.createElement(LikeButton, {comment}), element)
  })
