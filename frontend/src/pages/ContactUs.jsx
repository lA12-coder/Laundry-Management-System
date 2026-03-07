import React from 'react'
import CommonHero from "../components/common/CommonHero"
import ContactMain from '../components/layout/ContactMain';
import ContactMap from '../components/layout/ContactMap';
const ContactUs = () => {
  return (
    <>
      <CommonHero
        titlePrefix="Contact"
        titleHighlight="Us"
        description="Have questions or feedback? We'd love to hear from you!"
        breadcrumb="Contact Us"
      />
      <ContactMain />
      <ContactMap />
    </>
  )
}

export default ContactUs
