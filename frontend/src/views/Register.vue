<template>
  <div class="register">
    <div class="register-container">
      <h2>🎵 曼波音乐注册</h2>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            type="text" 
            id="username" 
            v-model="formData.username" 
            placeholder="请输入用户名"
            required
          >
        </div>
        
        <div class="form-group">
          <label for="email">邮箱</label>
          <input 
            type="email" 
            id="email" 
            v-model="formData.email" 
            placeholder="请输入邮箱"
            required
          >
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="formData.password" 
            placeholder="请输入密码（至少6位）"
            required
            minlength="6"
          >
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="formData.confirmPassword" 
            placeholder="请再次输入密码"
            required
          >
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button type="submit" class="register-btn" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <div class="register-footer">
        <p>已有账号？<router-link to="/login">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { userAPI } from '@/api'

const router = useRouter()
const formData = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  if (formData.value.password !== formData.value.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }
  
  if (formData.value.password.length < 6) {
    error.value = '密码长度至少为6位'
    return
  }
  
  try {
    loading.value = true
    error.value = ''
    
    console.log('准备发送注册请求:', {
      username: formData.value.username,
      email: formData.value.email,
      password: formData.value.password
    })
    
    const response = await userAPI.register({
      username: formData.value.username,
      email: formData.value.email,
      password: formData.value.password
    })
    
    console.log('注册响应:', response)
    
    if (response.success) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      router.push('/')
    } else {
      error.value = response.message || '注册失败，请稍后重试'
    }
  } catch (err) {
    console.error('注册错误:', err)
    console.error('错误详情:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    })
    if (err.response && err.response.data) {
      error.value = err.response.data.message || '注册失败，请稍后重试'
    } else {
      error.value = '网络错误，请检查网络连接'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.register-container h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #42b883;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: bold;
  color: #333;
}

.form-group input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-group input:focus {
  outline: none;
  border-color: #42b883;
}

.error-message {
  color: #ff4444;
  background-color: #ffeeee;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.register-btn {
  padding: 12px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.register-btn:hover:not(:disabled) {
  background-color: #349268;
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-footer {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.register-footer a {
  color: #42b883;
  text-decoration: none;
}

.register-footer a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .register {
    min-height: 100vh;
    padding: 15px;
    padding-top: 70px;
  }
  
  .register-container {
    padding: 25px 20px;
    border-radius: 16px;
  }
  
  .register-container h2 {
    font-size: 20px;
    margin-bottom: 25px;
  }
  
  .register-form {
    gap: 15px;
  }
  
  .form-group input {
    padding: 14px;
    font-size: 15px;
  }
  
  .register-btn {
    padding: 14px;
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .register-container {
    padding: 20px 15px;
  }
  
  .register-container h2 {
    font-size: 18px;
  }
}
</style>
