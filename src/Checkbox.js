import React from 'react'

export const CheckBox = props => {
  console.log(props)
    return (
      <li key={props.id}>
       <input key={props.id} onChange={props.handleCheckChildElement} type="checkbox" checked={props.isChecked} value={props.value} />
      </li>
    )
}

export default CheckBox