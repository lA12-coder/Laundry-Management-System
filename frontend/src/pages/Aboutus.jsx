import CommonHero from "../components/common/CommonHero";
import OurStory from "../components/layout/OurStory";
import MissionVision from "../components/layout/MissionVision";
import OurTeam from "../components/layout/OurTeam";
import AboutVideo from "../components/layout/AboutVideo";

const Aboutus = () => {
  return (
    <>
      <CommonHero
        titlePrefix="About"
        titleHighlight="Us"
        description="Discover the story behind FuaLaundry, our mission to revolutionize laundry services, and meet the passionate team dedicated to providing you with the best experience."
        breadcrumb="About Us"
      />
      <OurStory />
      <MissionVision />
      <OurTeam />
      <AboutVideo/>
    </>
  );
};

export default Aboutus;
