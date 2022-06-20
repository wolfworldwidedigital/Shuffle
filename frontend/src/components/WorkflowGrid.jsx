import React, { useEffect, useState } from 'react';

import { useTheme } from '@material-ui/core/styles';
import {Link} from 'react-router-dom';

import { Search as SearchIcon, CloudQueue as CloudQueueIcon, Code as CodeIcon } from '@material-ui/icons';

import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure, connectSearchBox, connectHits } from 'react-instantsearch-dom';
import { 
	Grid, 
	Paper, 
	TextField, 
	ButtonBase, 
	InputAdornment, 
	Typography, 
	Button, 
	Tooltip, 
	Zoom,
	Chip,
} from '@material-ui/core';

import WorkflowPaper from "../components/WorkflowPaper.jsx"

const searchClient = algoliasearch("JNSS5CFDZZ", "db08e40265e2941b9a7d8f644b6e5240")
const AppGrid = props => {
	const { maxRows, showName, showSuggestion, isMobile, globalUrl, parsedXs }  = props

  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io";

	const rowHandler = maxRows === undefined || maxRows === null ? 50 : maxRows
	const xs = parsedXs === undefined || parsedXs === null ? isMobile ? 6 : 2 : parsedXs
	const theme = useTheme();
	//const [apps, setApps] = React.useState([]);
	//const [filteredApps, setFilteredApps] = React.useState([]);
	const [formMail, setFormMail] = React.useState("");
	const [message, setMessage] = React.useState("");
	const [formMessage, setFormMessage] = React.useState("");
  const [usecases, setUsecases] = React.useState([]);

	const buttonStyle = {borderRadius: 30, height: 50, width: 220, margin: isMobile ? "15px auto 15px auto" : 20, fontSize: 18,}

	const innerColor = "rgba(255,255,255,0.65)"
	const borderRadius = 3
	window.title = "Shuffle | Workflows | Discover your use-case"

	const submitContact = (email, message) => {
		const data = {
			"firstname": "",
			"lastname": "",
			"title": "",
			"companyname": "",
			"email": email,
			"phone": "",
			"message": message,
		}
	
		const errorMessage = "Something went wrong. Please contact frikky@shuffler.io directly."

		fetch(globalUrl+"/api/v1/contact", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
		.then(response => response.json())
		.then(response => {
			if (response.success === true) {
				setFormMessage(response.reason)
				//alert.info("Thanks for submitting!")
			} else {
				setFormMessage(errorMessage)
			}

			setFormMail("")
			setMessage("")
    })
		.catch(error => {
			setFormMessage(errorMessage)
    	console.log(error)
		});
	}

	const handleKeysetting = (categorydata, workflows) => {
		console.log("Workflows: ", workflows)
		//workflows[0].category = ["detect"]
		//workflows[0].usecase_ids = ["Correlate tickets"]

		if (workflows !== undefined && workflows !== null) {
			const newcategories = []
			for (var key in categorydata) {
				var category = categorydata[key]
				category.matches = []

				for (var subcategorykey in category.list) {
					var subcategory = category.list[subcategorykey]
					subcategory.matches = []

					for (var workflowkey in workflows) {
						const workflow = workflows[workflowkey]

						if (workflow.usecase_ids !== undefined && workflow.usecase_ids !== null) {
							for (var usecasekey in workflow.usecase_ids) {
								if (workflow.usecase_ids[usecasekey].toLowerCase() === subcategory.name.toLowerCase()) {
									console.log("Got match: ", workflow.usecase_ids[usecasekey])

									category.matches.push({
										"workflow": workflow.id,
										"category": subcategory.name,
									})
									subcategory.matches.push(workflow.id)
									break
								}
							}
						}

						if (subcategory.matches.length > 0) {
							break
						}
					}
				}

				newcategories.push(category)
			} 

			console.log("Categories: ", newcategories)
			setUsecases(newcategories)
		} else {
			for (var key in categorydata) {
				categorydata[key].matches = []
			}
  		setUsecases(categorydata)
		}
	}

  const fetchUsecases = (workflows) => {
    fetch(globalUrl + "/api/v1/workflows/usecases", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for usecases");
        }

        return response.json();
      })
      .then((responseJson) => {
				if (responseJson.success !== false) {
					console.log("Usecases: ", responseJson)
					//handleKeysetting(responseJson, workflows)
				}
      })
      .catch((error) => {
        //alert.error("ERROR: " + error.toString());
        console.log("ERROR: " + error.toString());
      });
  };

	useEffect(() => {
		fetchUsecases()
	}, [])

	// value={currentRefinement}
	const SearchBox = ({currentRefinement, refine, isSearchStalled} ) => {
		useEffect(() => {
			if (window !== undefined && window.location !== undefined && window.location.search !== undefined && window.location.search !== null) {
				const urlSearchParams = new URLSearchParams(window.location.search)
				const params = Object.fromEntries(urlSearchParams.entries())
				const foundQuery = params["q"]
				if (foundQuery !== null && foundQuery !== undefined) {
					console.log("Got query: ", foundQuery)
					refine(foundQuery)
				}
			}
		}, [])

		return (
		  <form noValidate action="" role="search">
				<TextField 
					fullWidth
					style={{backgroundColor: theme.palette.inputColor, borderRadius: borderRadius, margin: 10, width: "100%",}} 
					InputProps={{
						style:{
							color: "white",
							fontSize: "1em",
							height: 50,
						},
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon style={{marginLeft: 5}}/>
							</InputAdornment>
						),
					}}
					autoComplete='off'
					type="search"
					color="primary"
					value={currentRefinement}
					placeholder="Find Workflows..."
					id="shuffle_search_field"
					onChange={(event) => {
						refine(event.currentTarget.value)
					}}
					limit={5}
				/>
				{/*isSearchStalled ? 'My search is stalled' : ''*/}
			</form>
		)
	}

	const paperAppContainer = {
    display: "flex",
    flexWrap: "wrap",
    alignContent: "space-between",
    marginTop: 5,
  }
	
	var workflowDelay = -50
	const Hits = ({ hits }) => {
		const [mouseHoverIndex, setMouseHoverIndex] = useState(-1) 
		var counted = 0


		return (
      <Grid container spacing={4} style={paperAppContainer}>
				{hits.map((data, index) => {
					workflowDelay += 50

					return (
						<Zoom key={index} in={true} style={{ transitionDelay: `${workflowDelay}ms` }}>
							<Grid item xs={4} style={{ padding: "12px 10px 12px 10px" }}>
								<WorkflowPaper key={index} data={data} />
							</Grid>
						</Zoom>
					)
				})}
			</Grid>
		)
	}

	const CustomSearchBox = connectSearchBox(SearchBox)
	const CustomHits = connectHits(Hits)

	return (
		<div style={{width: "100%", position: "relative", height: "100%",}}>
			<InstantSearch searchClient={searchClient} indexName="workflows">
				<Configure clickAnalytics />
				<div style={{maxWidth: 450, margin: "auto", marginTop: 15, marginBottom: 15, }}>
					<CustomSearchBox />
				</div>
				{usecases !== null && usecases !== undefined && usecases.length > 0 ? 
					<div style={{ display: "flex", margin: "auto", width: 875,}}>
						{usecases.map((usecase, index) => {
							console.log(usecase)
							return (
								<Chip
									key={usecase.name}
									style={{
										backgroundColor: theme.palette.surfaceColor,
										marginRight: 10, 
										paddingLeft: 5,
										paddingRight: 5,
										height: 28,
										cursor: "pointer",
										border: `1px solid ${usecase.color}`,
										color: "white",
									}}
									label={`${usecase.name} (${usecase.matches.length}/${usecase.list.length})`}
									onClick={() => {
										console.log("Clicked!")
										//addFilter(usecase.name.slice(3,usecase.name.length))
									}}
									variant="outlined"
									color="primary"
								/>
							)
						})}
					</div>
				: null}
				<CustomHits hitsPerPage={5}/>
			</InstantSearch>
			{showSuggestion === true ? 
				<div style={{maxWidth: isMobile ? "100%" : "60%", margin: "auto", paddingTop: 100, textAlign: "center",}}>
					<Typography variant="h6" style={{color: "white", marginTop: 50,}}>
						Can't find what you're looking for? 
					</Typography>
					<div style={{flex: "1", display: "flex", flexDirection: "row"}}>
						<TextField
							required
							style={{flex: "1", marginRight: "15px", backgroundColor: theme.palette.inputColor}}
							InputProps={{
								style:{
									color: "#ffffff",
								},
							}}
							color="primary"
							fullWidth={true}
							placeholder="Email (optional)"
							type="email"
						  id="email-handler"
							autoComplete="email"
							margin="normal"
							variant="outlined"
      	 				onChange={e => setFormMail(e.target.value)}
						/>
						<TextField
							required
							style={{flex: "1", backgroundColor: theme.palette.inputColor}}
							InputProps={{
								style:{
									color: "#ffffff",
								},
							}}
							color="primary"
							fullWidth={true}
							placeholder="What apps do you want to see?"
							type=""
						  id="standard-required"
							margin="normal"
							variant="outlined"
							autoComplete="off"
      	 			onChange={e => setMessage(e.target.value)}
						/>
					</div>
					<Button
						variant="contained"
						color="primary"
						style={buttonStyle}
						disabled={message.length === 0}
						onClick={() => {
							submitContact(formMail, message)
						}}
					>
						Submit	
					</Button>
					<Typography style={{color: "white"}} variant="body2">{formMessage}</Typography>
				</div>
				: null
			}

			<span style={{position: "absolute", display: "flex", textAlign: "right", float: "right", right: 0, bottom: 120, }}>
				<Typography variant="body2" color="textSecondary" style={{}}>
					Search by 
				</Typography>
				<a rel="noopener noreferrer" href="https://www.algolia.com/" target="_blank" style={{textDecoration: "none", color: "white"}}>
					<img src={"/images/logo-algolia-nebula-blue-full.svg"} alt="Algolia logo" style={{height: 17, marginLeft: 5, marginTop: 3,}} />
				</a>
			</span>
		</div>
	)
}

export default AppGrid;
