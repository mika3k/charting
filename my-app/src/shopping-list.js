import React from 'react';

class ShoppingList extends React.Component {
  render() {
    return (
      <div className="shopping-list">
        <h1>Shopping list for {this.props.name}</h1>
        <ul>
          <li>Bread.</li>
          <li>Butter.</li>
          <li>Something delitious...</li>
        </ul>
      </div>
    )
  }
}

// usage: <ShoppingList name="Me" />