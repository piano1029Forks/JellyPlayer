/** @format */

import { useState } from "react";

import { Blurhash } from "react-blurhash";

import { useQuery } from "@tanstack/react-query";

import { EventEmitter as event } from "../../eventEmitter";
import { getServer } from "../../utils/storage/servers";
import { getUser, delUser } from "../../utils/storage/user";

import { theme } from "../../theme";
import "./home.module.scss";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";

import { yellow } from "@mui/material/colors";

import Carousel from "react-material-ui-carousel";

// Custom Components
import { Card } from "../../components/card/card";
import { CardScroller } from "../../components/cardScroller/cardScroller";
import { LatestMediaSection } from "../../components/homeSection/latestMediaSection";
import { CarouselSkeleton } from "../../components/skeleton/carousel";
import { CardsSkeleton } from "../../components/skeleton/cards";

// Icons
import { MediaTypeIconCollection } from "../../components/utils/iconsCollection.jsx";
import { MdiStar } from "../../components/icons/mdiStar";
import { MdiPlayOutline } from "../../components/icons/mdiPlayOutline";
import { MdiChevronRight } from "../../components/icons/mdiChevronRight";

import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";

import { useNavigate } from "react-router-dom";

import { endsAt, getRuntime } from "../../utils/date/time";
import { BaseItemKind, ItemFields } from "@jellyfin/sdk/lib/generated-client";

const Home = () => {
	const authUser = useQuery({
		queryKey: ["home", "authenticateUser"],
		queryFn: async () => {
			const server = await getServer();
			const user = await getUser();
			event.emit("create-jellyfin-api", server.Ip);
			const auth = await window.api.authenticateUserByName(
				user.Name,
				user.Password,
			);
			sessionStorage.setItem("accessToken", auth.data.AccessToken);
			event.emit("set-api-accessToken", window.api.basePath);
			return true;
		},
		enabled: false,
		networkMode: "always",
	});

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
	});

	const libraries = useQuery({
		queryKey: ["libraries"],
		queryFn: async () => {
			let libs = await getUserViewsApi(window.api).getUserViews({
				userId: user.data.Id,
			});
			return libs.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

	const latestMedia = useQuery({
		queryKey: ["home", "latestMedia"],
		queryFn: async () => {
			const media = await getUserLibraryApi(window.api).getLatestMedia(
				{
					userId: user.data.Id,
					fields: [ItemFields.Overview, ItemFields.ParentId],
					enableUserData: true,
				},
			);
			return media.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

	const resumeItemsVideo = useQuery({
		queryKey: ["home", "resume", "video"],
		queryFn: async () => {
			const resumeItems = await getItemsApi(window.api).getResumeItems(
				{
					userId: user.data.Id,
					limit: 16,
					mediaTypes: ["Video"],
					enableUserData: true,
				},
			);
			return resumeItems.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

	const resumeItemsAudio = useQuery({
		queryKey: ["home", "resume", "audio"],
		queryFn: async () => {
			const resumeItems = await getItemsApi(window.api).getResumeItems(
				{
					userId: user.data.Id,
					limit: 16,
					mediaTypes: ["Audio"],
					enableUserData: true,
				},
			);
			return resumeItems.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

	const upNextItems = useQuery({
		queryKey: ["home", "upNext"],
		queryFn: async () => {
			const upNext = await getTvShowsApi(window.api).getNextUp({
				userId: user.data.Id,
				limit: 16,
			});
			return upNext.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

	const [latestMediaLibs, setLatestMediaLibs] = useState([]);

	const navigate = useNavigate();

	const excludeTypes = ["boxsets", "playlists", "livetv", "channels"];

	const handleLogout = async () => {
		console.log("Logging out user...");
		await window.api.logout();
		delUser();
		sessionStorage.removeItem("accessToken");
		event.emit("create-jellyfin-api", window.api.basePath);
		navigate("/login");
	};

	let tempData = [];
	if (libraries.status == "success") {
		libraries.data.Items.map((lib) => {
			if (!excludeTypes.includes(lib.CollectionType)) {
				tempData = latestMediaLibs;
				if (
					!tempData.some(
						(el) =>
							JSON.stringify(el) ==
							JSON.stringify([lib.Id, lib.Name]),
					)
				) {
					tempData.push([lib.Id, lib.Name]);
					setLatestMediaLibs(tempData);
				}
			}
		});
	}

	if (user.isPaused) {
		user.refetch();
		console.log(user.isError);
	}

	return (
		<>
			<Box
				component="main"
				className="scrollY"
				sx={{
					flexGrow: 1,
					pt: 11,
					px: 3,
					pb: 3,
					position: "relative",
				}}
			>
				<Carousel
					className="hero-carousel"
					autoPlay={true}
					animation="fade"
					height="70vh"
					IndicatorIcon={
						<div className="hero-carousel-indicator"></div>
					}
					activeIndicatorIconButtonProps={{
						style: {
							background: "rgb(255 255 255)",
						},
					}}
					indicatorIconButtonProps={{
						style: {
							background: "rgb(255 255 255 / 0.3)",
							borderRadius: "2px",
							width: "100%",
							flexShrink: "1",
						},
					}}
					indicatorContainerProps={{
						style: {
							display: "flex",
							gap: "1em",
						},
					}}
					sx={{
						marginBottom: "1.5em",
					}}
					interval={10000}
				>
					{latestMedia.isLoading ? (
						<CarouselSkeleton />
					) : (
						// <></>
						latestMedia.data != null &&
						latestMedia.data.map((item, index) => {
							return (
								<Paper
									className="hero-carousel-slide"
									sx={{
										background:
											theme.palette.primary
												.background.dark,
									}}
									key={index}
								>
									<div className="hero-carousel-background-container">
										{item.Type ==
											BaseItemKind.MusicAlbum ||
										item.Type ==
											BaseItemKind.Episode ? (
											item
												.ParentBackdropImageTags
												.length != 0 && (
												<>
													<Blurhash
														hash={
															item
																.ImageBlurHashes
																.Backdrop[
																item
																	.ParentBackdropImageTags[0]
															]
														}
														// hash="LEHV6nWB2yk8pyo0adR*.7kCMdnj"
														width="1080"
														height="720"
														resolutionX={
															64
														}
														resolutionY={
															96
														}
														className="hero-carousel-background-blurhash"
														punch={1}
													/>
													<div
														className="hero-carousel-background-image"
														style={{
															backgroundImage: `url(${window.api.basePath}/Items/${item.ParentBackdropItemId}/Images/Backdrop)`,
														}}
													></div>
												</>
											)
										) : item.ImageBlurHashes
												.Backdrop ? (
											<>
												{item
													.BackdropImageTags
													.length !=
													0 && (
													<Blurhash
														hash={
															item
																.ImageBlurHashes
																.Backdrop[
																item
																	.BackdropImageTags[0]
															]
														}
														// hash="LEHV6nWB2yk8pyo0adR*.7kCMdnj"
														width="1080"
														height="720"
														resolutionX={
															64
														}
														resolutionY={
															96
														}
														className="hero-carousel-background-blurhash"
														punch={1}
													/>
												)}
												<div
													className="hero-carousel-background-image"
													style={{
														backgroundImage: `url(${
															window
																.api
																.basePath +
															"/Items/" +
															item.Id +
															"/Images/Backdrop"
														})`,
													}}
												></div>
											</>
										) : (
											<div className="hero-carousel-background-image empty"></div>
										)}
										<div className="hero-carousel-background-icon-container">
											{
												MediaTypeIconCollection[
													item.MediaType
												]
											}
										</div>
									</div>
									<Box className="hero-carousel-detail">
										<Typography
											variant="h3"
											className="hero-carousel-text"
											sx={{
												mb: 2.5,
											}}
										>
											{!item.ImageTags.Logo ? (
												item.Name
											) : (
												<img
													className="hero-carousel-text-logo"
													src={
														window.api
															.basePath +
														"/Items/" +
														item.Id +
														"/Images/Logo?quality=80&tag=" +
														item
															.ImageTags
															.Logo
													}
												></img>
											)}
										</Typography>
										<Stack
											// sx={{
											// 	display: "flex",
											// 	alignItems:
											// 		"center",
											// 	width: "fit-content",
											// 	gap: "1em",
											// 	mb: 1.5,
											// }}
											direction="row"
											gap={1}
											divider={
												<Divider
													variant="middle"
													component="div"
													orientation="vertical"
													flexItem
												/>
											}
											className="hero-carousel-info"
										>
											<Typography
												variant="subtitle1"
												// color="GrayText"
											>
												{!!item.ProductionYear
													? item.ProductionYear
													: "Unknown"}
											</Typography>
											<Chip
												variant="outlined"
												label={
													!!item.OfficialRating
														? item.OfficialRating
														: "Not Rated"
												}
											/>
											<Box
												sx={{
													display: "flex",
													gap: "0.25em",
													alignItems:
														"center",
												}}
												className="hero-carousel-info-rating"
											>
												{!!item.CommunityRating ? (
													<>
														<MdiStar
															sx={{
																color: yellow[700],
															}}
														/>
														<Typography variant="subtitle1">
															{Math.round(
																item.CommunityRating *
																	10,
															) /
																10}
														</Typography>
													</>
												) : (
													<Typography variant="subtitle1">
														No
														Community
														Rating
													</Typography>
												)}
											</Box>
											{!!item.RunTimeTicks && (
												<Typography variant="subtitle1">
													{getRuntime(
														item.RunTimeTicks,
													)}
												</Typography>
											)}
											{!!item.RunTimeTicks && (
												<Typography variant="subtitle1">
													{endsAt(
														item.RunTimeTicks,
													)}
												</Typography>
											)}
										</Stack>
										<Typography
											variant="subtitle1"
											className="hero-carousel-text"
											sx={{
												display: "-webkit-box",
												maxWidth: "70%",
												maxHeight: "30%",
												textOverflow:
													"ellipsis",
												overflow: "hidden",
												WebkitLineClamp:
													"3",
												WebkitBoxOrient:
													"vertical",
												opacity: 0.7,
											}}
										>
											{item.Overview}
										</Typography>
										{/* TODO Link PLay and More info buttons in carousel */}
										<Box
											sx={{
												display: "flex",
												gap: 3,
												mt: 3,
											}}
											className="hero-carousel-button-container"
										>
											<Button
												variant="contained"
												endIcon={
													<MdiPlayOutline />
												}
												disabled
											>
												Play
											</Button>
											<Button
												color="white"
												variant="outlined"
												endIcon={
													<MdiChevronRight />
												}
												onClick={() =>
													navigate(
														`/item/${item.Id}`,
													)
												}
											>
												More info
											</Button>
										</Box>
									</Box>
								</Paper>
							);
						})
					)}
				</Carousel>
				{libraries.isLoading ? (
					<CardsSkeleton />
				) : (
					<CardScroller displayCards={4} title="Libraries">
						{libraries.status == "success" &&
							libraries.data.Items.map((item, index) => {
								return (
									<Card
										key={index}
										itemName={item.Name}
										itemId={item.Id}
										// imageTags={false}
										imageTags={
											!!item.ImageTags.Primary
										}
										cardType="lib"
										cardOrientation="landscape"
										iconType={item.CollectionType}
										onClickEvent={() => {
											navigate(
												`/library/${item.Id}`,
											);
										}}
										blurhash={
											item.ImageBlurHashes ==
											{}
												? ""
												: !!item.ImageTags
														.Primary
												? !!item
														.ImageBlurHashes
														.Primary
													? item
															.ImageBlurHashes
															.Primary[
															item
																.ImageTags
																.Primary
													  ]
													: ""
												: ""
										}
										currentUser={user.data}
									></Card>
								);
							})}
					</CardScroller>
				)}
				{upNextItems.isLoading ? (
					<CardsSkeleton />
				) : upNextItems.isSuccess &&
				  upNextItems.data.Items.length == 0 ? (
					<></>
				) : (
					<CardScroller displayCards={4} title="Up Next">
						{upNextItems.data.Items.map((item, index) => {
							return (
								<Card
									key={index}
									itemName={
										!!item.SeriesId
											? item.SeriesName
											: item.Name
									}
									itemId={
										!!item.SeriesId
											? item.SeriesId
											: item.Id
									}
									// imageTags={false}
									imageTags={
										!!item.ImageTags.Primary
									}
									cardType="thumb"
									iconType={item.Type}
									subText={
										!!item.SeriesId
											? "S" +
											  item.ParentIndexNumber +
											  ":E" +
											  item.IndexNumber +
											  " - " +
											  item.Name
											: item.ProductionYear
									}
									cardOrientation="landscape"
									blurhash={
										item.ImageBlurHashes == {}
											? ""
											: !!item.ImageTags
													.Primary
											? !!item.ImageBlurHashes
													.Primary
												? item
														.ImageBlurHashes
														.Primary[
														item
															.ImageTags
															.Primary
												  ]
												: ""
											: ""
									}
									currentUser={user.data}
									favourite={
										item.UserData.IsFavorite
									}
								></Card>
							);
						})}
					</CardScroller>
				)}
				{resumeItemsVideo.isLoading ? (
					<CardsSkeleton />
				) : resumeItemsVideo.data.Items.length == 0 ? (
					<></>
				) : (
					<CardScroller
						displayCards={4}
						title="Continue Watching"
					>
						{resumeItemsVideo.data.Items.map(
							(item, index) => {
								return (
									<Card
										key={index}
										itemName={
											!!item.SeriesId
												? item.SeriesName
												: item.Name
										}
										itemId={
											!!item.SeriesId
												? item.SeriesId
												: item.Id
										}
										// imageTags={false}
										imageTags={
											!!item.SeriesId
												? item
														.ParentBackdropImageTags
														.length !=
												  0
												: item
														.BackdropImageTags
														.length !=
												  0
										}
										cardType="thumb"
										iconType={item.Type}
										subText={
											!!item.SeriesId
												? "S" +
												  item.ParentIndexNumber +
												  ":E" +
												  item.IndexNumber +
												  " - " +
												  item.Name
												: item.ProductionYear
										}
										playedPercent={
											item.UserData
												.PlayedPercentage
										}
										cardOrientation="landscape"
										blurhash={
											item.ImageBlurHashes ==
											{}
												? ""
												: !!item.ImageTags
														.Backdrop
												? !!item
														.ImageBlurHashes
														.Backdrop
													? item
															.ImageBlurHashes
															.Backdrop[
															item
																.ImageTags
																.Backdrop
													  ]
													: ""
												: ""
										}
										currentUser={user.data}
										favourite={
											item.UserData.IsFavorite
										}
									></Card>
								);
							},
						)}
					</CardScroller>
				)}
				{resumeItemsAudio.isLoading ? (
					<CardsSkeleton />
				) : resumeItemsAudio.data.Items.length == 0 ? (
					<></>
				) : (
					<CardScroller
						displayCards={4}
						title="Continue Listening"
					>
						{resumeItemsAudio.data.Items.map(
							(item, index) => {
								return (
									<Card
										key={index}
										itemName={
											!!item.SeriesId
												? item.SeriesName
												: item.Name
										}
										itemId={
											!!item.SeriesId
												? item.SeriesId
												: item.Id
										}
										// imageTags={false}
										imageTags={
											!!item.ImageTags.Primary
										}
										iconType={item.Type}
										subText={item.ProductionYear}
										playedPercent={
											item.UserData
												.PlayedPercentage
										}
										cardOrientation="sqaure"
										blurhash={
											item.ImageBlurHashes ==
											{}
												? ""
												: !!item.ImageTags
														.Primary
												? !!item
														.ImageBlurHashes
														.Primary
													? item
															.ImageBlurHashes
															.Primary[
															item
																.ImageTags
																.Primary
													  ]
													: ""
												: ""
										}
										currentUser={user.data}
										favourite={
											item.UserData.IsFavorite
										}
									></Card>
								);
							},
						)}
					</CardScroller>
				)}
				{latestMediaLibs.map((lib, index) => {
					return (
						<LatestMediaSection
							key={lib[0]}
							latestMediaLib={lib}
						/>
					);
				})}

				<Button variant="contained" onClick={handleLogout}>
					Logout
				</Button>
			</Box>
		</>
	);
};

/* <MuiDrawer
					anchor="left"
					open={drawerState}
					onClose={handleDrawerClose}
				>
					<DrawerHeader
						className="Mui-DrawerHeader"
						sx={{ position: "relative", height: "20vh" }}
					>
						<div>
						<Avatar src={""}/>
						<Typography variant="h3">
						{user["Name"]}
						</Typography>
					</div>
						<IconButton
							onClick={handleDrawerClose}
							sx={{
								position: "absolute",
								top: "10%",
								right: "5%",
							}}
						>
							<Close />
						</IconButton>
					</DrawerHeader>
					<Divider />
					<List sx={{ border: "none" }}>
						{userLibraries.map((library, index) => {
							return (
								<ListItem disablePadding key={index}>
									<ListItemButton
										sx={{
											minHeight: 48,
											justifyContent:
												drawerState
													? "initial"
													: "center",
											px: 2.5,
										}}
									>
										<ListItemIcon
											sx={{
												minWidth: 0,
												mr: 3,
												justifyContent:
													"center",
											}}
										>
											{
												MediaCollectionTypeIconCollection[
													library
														.CollectionType
												]
											}
										</ListItemIcon>
										<ListItemText
											primary={library.Name}
										/>
									</ListItemButton>
								</ListItem>
							);
						})}
					</List>
				</MuiDrawer> */

export default Home;
