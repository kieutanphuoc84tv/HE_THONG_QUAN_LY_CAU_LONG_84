import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLoader from '../components/PageLoader'
import { setStoredAuth } from '../utils/authStorage'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [msg, setMsg] = useState('Đang xử lý đăng nhập...')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userStr = params.get('user')
    const error = params.get('error')

    if (error) {
      navigate(`/login?error=${error}`)
      return
    }

    if (!token || !userStr) {
      navigate('/login')
      return
    }

    try {
      const user = JSON.parse(decodeURIComponent(userStr))
      setStoredAuth(token, user, true)

      const messageTimer = window.setTimeout(() => {
        setMsg(`Xin chào, ${user.hoTen}! Đang chuyển trang...`)
      }, 0)

      const redirectTimer = window.setTimeout(() => {
        if (user.role === 'Admin' || user.role === 'QuanLy') {
          navigate('/admin/dashboard', { replace: true })
        } else if (user.role === 'HuanLuyenVien') {
          navigate('/coach/dashboard', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      }, 800)

      return () => {
        window.clearTimeout(messageTimer)
        window.clearTimeout(redirectTimer)
      }
    } catch {
      navigate('/login?error=parse')
    }
  }, [navigate])

  return <PageLoader title="Đang đăng nhập" subtitle={msg} />
}
