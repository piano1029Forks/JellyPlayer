/** @format */

import { useState } from "react";
import PropTypes from "prop-types";

import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

import { MdiChevronLeft } from "../icons/mdiChevronLeft";
import { MdiChevronRight } from "../icons/mdiChevronRight";

import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ButtonGroup from "@mui/material/ButtonGroup";

import "./cardScroller.module.scss";
export const CardScroller = ({
	children,
	displayCards,
	title,
	headingProps,
	disableDecoration = false,
	boxProps,
}) => {
	const responsive = {
		superLargeDesktop: {
			// the naming can be any, depends on you.
			breakpoint: { max: 4000, min: 3000 },
			items: displayCards + 1,
			slidesToSlide: displayCards + 1,
		},
		desktop: {
			breakpoint: { max: 3000, min: 1025 },
			items: displayCards,
			slidesToSlide: displayCards, // optional, default to 1.
		},
		tablet: {
			breakpoint: { max: 1024, min: 464 },
			items: displayCards - 2,
			slidesToSlide: displayCards - 2, // optional, default to 1.
		},
		mobile: {
			breakpoint: { max: 464, min: 0 },
			items: displayCards - 3,
			slidesToSlide: displayCards - 3, // optional, default to 1.
		},
	};

	const [carouselRef, setCarouselRef] = useState();

	return (
		<Box {...boxProps} className="card-scroller-container" mb={1}>
			<Box
				sx={{ mb: 1 }}
				className={
					disableDecoration
						? `card-scroller-header-container hidden-decoration`
						: `card-scroller-header-container`
				}
			>
				<Typography
					variant="h4"
					color="textPrimary"
					className="card-scroller-heading"
					{...headingProps}
				>
					<div className="card-scroller-heading-decoration"></div>{" "}
					{title}
				</Typography>
				<ButtonGroup className="card-scroller-button-group">
					<IconButton
						className="card-scroller-button"
						onClick={() => carouselRef.previous()}
					>
						<MdiChevronLeft />
					</IconButton>
					<IconButton
						className="card-scroller-button"
						onClick={() => carouselRef.next()}
					>
						<MdiChevronRight />
					</IconButton>
				</ButtonGroup>
			</Box>
			<Carousel
				swipeable={false}
				draggable={false}
				responsive={responsive}
				arrows={false}
				ref={(el) => setCarouselRef(el)}
				// customButtonGroup={<HomeSectionHeader />}
				// renderButtonGroupOutside={true}
				className="card-scroller"
			>
				{children}
			</Carousel>
		</Box>
	);
};

CardScroller.propTypes = {
	displayCards: PropTypes.number.isRequired,
	title: PropTypes.string.isRequired,
	headingProps: PropTypes.any,
};
