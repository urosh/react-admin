import React, { Component } from 'react';
import MenuItemsList from './MenuItemsList';

import MenuItem from './MenuItem';

class PanelMenu extends Component {
	constructor() {
		super();
		this.itemHover = this.itemHover.bind(this);
		this.itemClick = this.itemClick.bind(this);
		this.itemHoverOut = this.itemHoverOut.bind(this);
		this.state = {
			activeItem: 0,
			hoverItem: -1
		}
	}
	itemHover(index) {
		this.setState({
			hoverItem: index
		});
	}
	
	itemClick(index) {
		console.log('We clicked the menu item');
		this.setState({
			activeItem: index
		})
	}	
	
	itemHoverOut() {
		this.setState({
			hoverItem: -1
		})
	}
	render() {
		const dashMenu = MenuItemsList.map((item, index) => {
			return <MenuItem 
				key={index} 
				itemIndex={index}  
				hoverHandler={this.itemHover} 
				clickHandler={this.itemClick}
				hoverOutHanlder={this.itemHoverOut} 
				activeItem={this.state.activeItem} 
				hoverItem={this.state.hoverItem}
				item={item} />

		});

		return (
			<div className="dashboard-menu">
				<div className="menu-header">
		        	<div id="logo-container" className="logo-container">
		        		<div className="logo-holder holder">
				            <img src={require('../img/logo_32.png')}/>
		        		</div>
		        		<div className="text-holder holder">
		        			<div className="top-text"><span className="left-text">market</span><span className="right-text">Notifications</span></div>
		                </div>
		        	</div>
		        </div>
				<div className="dashboard-menu-list" >
					{ dashMenu }
					
				</div>
			</div>
		);
	}
}


export default PanelMenu;
