
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // เช็คครั้งแรกเมื่อ component mount
    checkIfMobile()

    // ตรวจสอบเมื่อขนาดหน้าจอเปลี่ยน
    const handleResize = () => {
      checkIfMobile()
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return !!isMobile
}
