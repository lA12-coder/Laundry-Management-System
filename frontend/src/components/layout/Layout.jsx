import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { Outlet } from "react-router-dom";

import React from 'react'

const Layout = () => {
  return (
    <div>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout
