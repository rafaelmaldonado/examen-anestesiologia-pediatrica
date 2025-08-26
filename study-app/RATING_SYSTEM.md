# Sistema de Calificaciones para Certificaciones

## Funcionalidades Implementadas

### 🌟 **Sistema de Calificación de Certificaciones**

He implementado un sistema completo de calificaciones que permite a los usuarios calificar y comentar sobre las certificaciones después de completar exitosamente un quiz.

### **Características Principales:**

#### 1. **Calificación por Estrellas (1-5 ⭐)**
- Sistema de calificación de 1 a 5 estrellas
- Interfaz interactiva con hover effects
- Validación de entrada requerida

#### 2. **Comentarios Opcionales**
- Los usuarios pueden dejar comentarios de hasta 500 caracteres
- Campo de texto opcional para feedback detallado
- Contador de caracteres en tiempo real

#### 3. **Restricciones de Acceso**
- Solo usuarios autenticados pueden calificar
- Solo disponible después de completar exitosamente un quiz (score ≥ 75%)
- Un usuario puede actualizar su calificación existente

#### 4. **Visualización de Calificaciones**
- **Página Principal**: Muestra rating promedio y número total de calificaciones en cada tarjeta de certificación
- **Página de Resultados**: Botón para calificar después de pasar el quiz
- **Página Dedicada de Reviews**: Vista completa de todas las calificaciones de una certificación
- **Panel de Admin**: Estadísticas de calificaciones en la sección de administración

#### 5. **Estadísticas Detalladas**
- Rating promedio calculado automáticamente
- Número total de calificaciones
- Distribución de calificaciones (1-5 estrellas) con gráficos de barras
- Reviews ordenadas por fecha (más recientes primero)

### **Componentes Creados:**

#### 🎯 **StarRating Component**
```typescript
<StarRating 
  rating={4.5} 
  onRatingChange={setRating}
  readonly={false}
  size="md"
  showText={true}
/>
```

#### 📝 **RatingForm Component**
- Modal para enviar calificaciones
- Formulario con validación
- Estados de carga durante envío

#### 📊 **RatingsDisplay Component**
- Muestra estadísticas resumidas
- Lista de reviews individuales
- Gráficos de distribución de calificaciones

### **APIs Implementadas:**

#### 📡 **GET /api/ratings**
- Obtiene todas las calificaciones de una certificación
- Calcula estadísticas automáticamente
- Retorna datos paginados y ordenados

#### 📡 **POST /api/ratings**
- Crea nueva calificación o actualiza existente
- Validación de usuario autenticado
- Previene calificaciones duplicadas (actualiza en su lugar)

### **Rutas Creadas:**

#### 🗂️ **Páginas Públicas**
- `/certifications/[id]/ratings` - Vista dedicada de todas las reviews

#### 🗂️ **Integración en Páginas Existentes**
- **Página Principal** (`/`) - Rating preview en tarjetas
- **Resultados de Quiz** (`/quiz/results`) - Formulario de calificación
- **Admin Stats** (`/admin/stats`) - Estadísticas de calificaciones

### **Base de Datos:**

#### 🗄️ **Colección `ratings`**
```typescript
interface Rating {
  id: string;
  userId: string;
  userEmail: string;
  certificationId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
  updatedAt?: Date; // Para actualizaciones
}
```

### **Tipos TypeScript:**

```typescript
interface RatingStats {
  certificationId: string;
  averageRating: number;
  totalRatings: number;
  ratingBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
```

### **Flujo de Usuario:**

1. **Usuario completa un quiz** → Si pasa (≥75%), ve botón "Rate This Certification"
2. **Hace clic en calificar** → Se abre modal con estrellas y campo de comentario
3. **Envía calificación** → Se guarda en base de datos, modal se cierra
4. **Otros usuarios ven la calificación** → Aparece en página principal y página dedicada
5. **Admins pueden ver estadísticas** → Panel de admin muestra métricas detalladas

### **Características de UX:**

- ✨ **Animaciones suaves** en hover de estrellas
- 🎨 **Diseño consistente** con el tema de la aplicación
- 📱 **Responsive** en todos los dispositivos
- ⚡ **Estados de carga** durante envío de calificaciones
- 🔒 **Validación robusta** en frontend y backend
- 🎯 **Feedback visual** claro para el usuario

### **Seguridad:**

- 🔐 Autenticación requerida para calificar
- 🛡️ Validación de datos en servidor
- 🚫 Prevención de spam (un rating por usuario por certificación)
- ✅ Sanitización de inputs

Este sistema completo mejora significativamente la experiencia del usuario al proporcionar transparencia sobre la calidad de las certificaciones y crear una comunidad de feedback constructivo.
