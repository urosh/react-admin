import React, { Component } from 'react';

const MenuItem  = (props) => {
	let itemActive = props.itemIndex === props.activeItem || props.itemIndex === props.hoverItem;
	return(
		<div 
			className={itemActive ? "panel-row active" : "panel-row"}  
			onMouseEnter={() => {
				console.log(props.itemIndex);
				props.hoverHandler(props.itemIndex)
			}} 
			onClick={() => {
				props.clickHandler(props.itemIndex)
			}}
			onMouseLeave={props.hoverOutHanlder}
			data-panel={props.item.data}
		>
			<div className="panel-marker panel-data"></div>
			<div className="panel-icon panel-data"><span className={props.item.icon}></span></div>
			<div className="panel-text panel-data">{props.item.name}</div>
		</div>
	)
}

export default MenuItem;