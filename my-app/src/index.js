import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class Square2 extends React.Component{
  constructor(props) {
    super(props)
    // this.state = {
    //   value: null,
    // }
  }
  render() {
    return (
      <button 
        className="square" 
        onClick={ () => { this.props.onClick() } }
      >
        {this.props.value}
      </button>
    );
  }
}

function Square(props) {
  return (
    <button
      className="square"
      onClick={props.onClick}
    >
      {props.value}
    </button>
  )
}

class Board extends React.Component {
  
  renderSquare(i) {
    return (
      <Square 
        value={this.props.squares[i]} 
        onClick={() => this.props.onClick(i)}
      />
    )
  }

  render() {
      return (
      <div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    )
  }
}

class Board2 extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      squares: Array(9).fill(null),
      xIsNext: true,
    }
  }
  renderSquare(i) {
    return (
      <Square 
        value={this.state.squares[i]} 
        onClick={() => this.handleClick(i)}
      />
    )
  }
  handleClick(i) {
    // ignore clicking clicked or if game is won
    if(this.state.squares[i] || calculateWinner(this.state.squares)){
      return ;
    }
    // copy substate and update, set updated state
    const squares = [...this.state.squares]
    squares[i] = this.state.xIsNext ? 'X' : 'O'
    this.setState({
      squares,
      xIsNext: !this.state.xIsNext
    })
  }

  render() {
    const winner = calculateWinner(this.state.squares)
    let status

    if (winner) {
      status = 'Winner: ' + winner
    }
    else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O')
    }
    
      return (
      <div>
        <div className="status">{status}</div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    )
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      history: [
        {squares: Array(9).fill(null)},
      ],
      stepNumber: 0,
      xIsNext: true,
    }
  }
  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1)
    const current = history[history.length -1]
    if(current.squares[i]){
      return ;
    }
    // is game is won?
    if(calculateWinner(current.squares)){
      return ;
    }
    
    // copy substate and update, set updated state
    const squares = [...current.squares]
    squares[i] = this.state.xIsNext ? 'X' : 'O'
    this.setState({
      history: history.concat([{squares}]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext
    })
  }
  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0,
    })
  }
  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber]
    const winner = calculateWinner(current.squares)

    const moves = history.map((step, move) => {
      const desc = move 
        ? 'Go to move #' + move
        : 'Go to game start'
      return (
        <li key={move}>
          <button onClick={() => this.jumpTo(move)}>{desc}</button>
        </li>
      )
    })

    let status
    if (winner) {
      status = 'Winner: ' + winner
    }
    else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O')
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board
            squares={current.squares}
            onClick={(i) => this.handleClick(i)}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <ol>{moves}</ol>
        </div>
      </div>
    )
  }
}

class Game2 extends React.Component {
  render() {
    return (
      <div className="game">
        <div className="game-board">
          <Board/>
        </div>
        <div className="game-info">
          <div>{/* status */}</div>
          <ol>{/* todo */}</ol>
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);


function calculateWinner(squares) {
  const lines = [
    [0,1,2],  // horizontal
    [3,4,5],
    [6,7,8],

    [0,3,6],  // vertical
    [1,4,7],
    [2,5,8],

    [0,4,8],  // diagonal
    [2,4,6],
  ]
  for (const line of lines) {
    const [a,b,c] = line
      if(squares[a]) {                 // square is not null
        if(                            // sqares have same value
          squares[a] === squares[b]      
          && squares[a] === squares[c]
        ) {
          return squares[a]            // winner square value
        }
      }
  }
  
  // every possibility checked without success
  return null
}