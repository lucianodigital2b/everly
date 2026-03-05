import React, { createContext, useContext, useEffect, useState } from "react";

import Api from "../apis";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  // const [isLogged, setIsLogged] = useState(false);
  // const [user, setUser] = useState(null);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   Api.user.get()
  //     .then((res) => {
  //       if (res) {
  //         setIsLogged(true);
  //         setUser(res);
  //       } else {
  //         setIsLogged(false);
  //         setUser(null);
  //       }
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //     })
  //     .finally(() => {
  //       setLoading(false);
  //     });
  // }, []);

  return (
    <GlobalContext.Provider
      value={{
        // isLogged,
        // setIsLogged,

      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
