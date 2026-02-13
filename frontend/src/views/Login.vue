<template>
  <div class="login">
    <div class="login-container">
      <h2>🎵 曼波音乐登录</h2>
      
      <form @submit.prevent="handleLogin" class="login-form">
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
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="formData.password" 
            placeholder="请输入密码"
            required
          >
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="login-footer">
        <p>还没有账号？<router-link to="/register">立即注册</router-link></p>
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
  password: ''
})
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const response = await userAPI.login(formData.value)
    
    if (response.success) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      router.push('/')
    } else {
      error.value = '登录失败，请检查用户名和密码'
    }
  } catch (err) {
    error.value = '登录失败，请检查用户名和密码'
    console.error('登录错误:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-container h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #42b883;
}

.login-form {
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

.login-btn {
  padding: 12px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.login-btn:hover:not(:disabled) {
  background-color: #349268;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.login-footer a {
  color: #42b883;
  text-decoration: none;
}

.login-footer a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .login {
    min-height: 100vh;
    padding: 15px;
    padding-top: 70px;
  }
  
  .login-container {
    padding: 25px 20px;
    border-radius: 16px;
  }
  
  .login-container h2 {
    font-size: 20px;
    margin-bottom: 25px;
  }
  
  .login-form {
    gap: 15px;
  }
  
  .form-group input {
    padding: 14px;
    font-size: 15px;
  }
  
  .login-btn {
    padding: 14px;
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 20px 15px;
  }
  
  .login-container h2 {
    font-size: 18px;
  }
}
</style>
