<script setup>
import { reactive, ref } from 'vue';

const emit = defineEmits(['logged-in']);
const form = reactive({ email: '', password: '' });
const error = ref('');

function submit() {
  if (!form.email || !form.password) {
    error.value = '請輸入帳號與密碼';
    return;
  }
  emit('logged-in');
}
</script>

<template>
  <main class="login-shell antialiased selection:bg-brand-100 selection:text-brand-700">
    <section class="login-card isolate">
      <div class="login-form-side">
        <img class="absolute left-0 top-0" src="/images/login_contnet_1.svg" alt="" aria-hidden="true" />
        <img class="absolute right-0 bottom-0" src="/images/login_contnet_2.svg" alt="" aria-hidden="true" />
        <div class="login-copy">
          
          <h1>Welcome to<br />Taiwan Textile Research Institute!</h1>
          <p class="login-subtitle">Login to your account</p>

          <form class="modern-login-form" @submit.prevent="submit">
            <label>
              <span>Email Address</span>
              <span class="line-input">
                <input v-model.trim="form.email" class="focus-visible:outline-none" type="text" placeholder="name@example.com" autocomplete="username" />
                <img src="/images/ic_mail.svg" alt="" aria-hidden="true" />
              </span>
            </label>
            <label>
              <span>Password</span>
              <span class="line-input">
                <input v-model="form.password" class="focus-visible:outline-none" type="password" placeholder="Start typing..." autocomplete="current-password" />
                <img src="/images/ic_password.svg" alt="" aria-hidden="true" />
              </span>
            </label>
            <p v-if="error" class="form-error">{{ error }}</p>
            <button type="submit" class="blue-button login-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500">Login</button>
          </form>
        </div>
      </div>
      <div class="login-art" aria-hidden="true"></div>
    </section>
  </main>
</template>
