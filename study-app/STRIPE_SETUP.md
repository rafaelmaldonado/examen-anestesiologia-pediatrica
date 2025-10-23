# Configuración de Stripe para Pagos

## Resumen de la Integración Implementada

Se ha implementado un sistema completo de pagos con Stripe que incluye:

### ✅ Funcionalidades Implementadas

1. **Sistema de Prueba Gratuita**
   - Cada usuario puede tomar 1 quiz gratis por certificación
   - Después debe pagar para continuar

2. **Gestión de Precios por Curso**
   - Los admins pueden configurar el precio de cada certificación
   - Precio por defecto: $29.99 USD
   - Opción de marcar cursos como gratuitos

3. **Integración Completa con Stripe**
   - Checkout sessions seguras
   - Webhooks para manejar pagos completados
   - Tracking de subscripciones y accesos

4. **UI Actualizada**
   - Componente PaymentButton para pagos
   - Información de precios en el admin panel
   - Estados de acceso del usuario claramente mostrados

## 🔧 Configuración Requerida

### 1. Configurar Variables de Entorno

En tu archivo `.env.local`, agrega las siguientes variables de Stripe:

```bash
# Stripe Configuration (Reemplaza con tus claves reales)
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Obtener las Claves de Stripe

1. **Ir a [Stripe Dashboard](https://dashboard.stripe.com/)**
2. **API Keys:**
   - Ve a "Developers" → "API Keys"
   - Copia la "Publishable key" para `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copia la "Secret key" para `STRIPE_SECRET_KEY`

3. **Webhook Secret:**
   - Ve a "Developers" → "Webhooks"
   - Crea un nuevo webhook endpoint: `https://tu-dominio.com/api/stripe/webhook`
   - Selecciona estos eventos:
     - `checkout.session.completed`
     - `payment_intent.payment_failed`
   - Copia el "Signing secret" para `STRIPE_WEBHOOK_SECRET`

### 3. Configurar el Webhook en Producción

Una vez que deploys la aplicación, actualiza la URL del webhook en Stripe Dashboard:
- URL: `https://tu-dominio-produccion.com/api/stripe/webhook`

## 💰 Cómo Usar el Sistema

### Para Administradores:

1. **Configurar Precios:**
   - Ve a `/admin/certifications`
   - Al crear/editar una certificación:
     - Marca "Free certification" si es gratuita
     - O establece un precio en USD (ej: 29.99)

2. **Monitorear Pagos:**
   - Los pagos se pueden ver en Stripe Dashboard
   - Las subscripciones se guardan en Firebase

### Para Usuarios:

1. **Primera Vez:**
   - Pueden tomar 1 quiz gratuito
   - Después aparece el botón de pago

2. **Después del Pago:**
   - Acceso ilimitado a quizzes de esa certificación
   - El estado se actualiza automáticamente

## 🗂️ Estructura de Datos Agregada

### Nuevas Colecciones en Firebase:

1. **`userSubscriptions`**
   ```javascript
   {
     userId: string,
     certificationId: string,
     stripeCustomerId?: string,
     stripePaymentIntentId?: string,
     status: 'pending' | 'paid' | 'failed' | 'refunded',
     amount: number, // en centavos
     createdAt: Date,
     paidAt?: Date
   }
   ```

2. **`quizAttempts`**
   ```javascript
   {
     userId: string,
     certificationId: string,
     isFreeAttempt: boolean,
     createdAt: Date
   }
   ```

### Campos Agregados a `certifications`:
```javascript
{
  // ... campos existentes
  price?: number, // precio en centavos
  isFree?: boolean // si es completamente gratis
}
```

## 🔐 Seguridad

- ✅ Todas las APIs verifican autenticación de usuario
- ✅ Verificación de admin para configurar precios
- ✅ Webhooks de Stripe verificados con signatures
- ✅ Validación de acceso antes de permitir quizzes

## 🚀 Próximos Pasos

1. **Configurar las claves de Stripe**
2. **Probar en modo test**
3. **Configurar webhook en producción**
4. **Cambiar a modo live cuando esté listo**

## 📝 Testing

Para probar pagos, usa estas tarjetas de prueba de Stripe:
- **Éxito:** 4242 4242 4242 4242
- **Fallo:** 4000 0000 0000 0002
- **Fecha:** Cualquier fecha futura
- **CVC:** Cualquier 3 dígitos

---

La integración está completa y lista para usar. Solo necesitas configurar las claves de Stripe y estará funcionando! 🎉
