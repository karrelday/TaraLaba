import '../styles/LoadingScreen.css'
import React, {useEffect, useState} from "react";

function LoadingScreen(){
    const [text, setText]= useState('')
    const [showImg, setShowImg] = useState(true)

    useEffect(() => {
        setTimeout(() => {
            setShowImg(false)
            setText(
                'hi times up'
            )
        }, 3000)
    })
    return(
        <>
            <div className="loading">
                {
                    showImg ? (
                        <img src='./public/loading.svg'/>
                    ):(
                        <h3></h3>
                    )
                }
            </div>
        </>
    )
}

export default LoadingScreen;
