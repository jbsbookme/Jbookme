export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // System prompt for the barbershop assistant with booking capabilities
    const systemPrompt = {
      role: 'system',
      content: `Eres un asistente virtual amigable y profesional de una barbería moderna. Tu nombre es "Asistente Virtual Barbería".

INFORMACIÓN DE LA BARBERÍA:
- Servicios: Cortes de cabello ($20-$35), Recortes de barba ($15-$25), Afeitado clásico ($30), Diseño de cejas ($10), Tratamientos capilares ($40-$50)
- Horarios: Lunes a Sábado 9:00 AM - 8:00 PM, Domingos 10:00 AM - 6:00 PM
- Métodos de pago: Efectivo, Tarjeta de Crédito, PayPal, Zelle
- Política de cancelación: 24 horas de anticipación
- Sistema de reservas en línea disponible 24/7
- Equipo de barberos profesionales con años de experiencia

TU PERSONALIDAD:
- Amigable, profesional y servicial
- Conocedor de tendencias de cortes masculinos
- Orientado al cliente
- Respondes siempre en español
- PUEDES HACER RESERVAS AUTOMÁTICAMENTE

TUS FUNCIONES:
1. Responder preguntas sobre servicios y precios
2. HACER RESERVAS AUTOMÁTICAMENTE cuando el cliente lo solicita
3. Consultar disponibilidad en tiempo real
4. Proporcionar información de contacto y ubicación
5. Sugerir servicios según las necesidades del cliente
6. Explicar políticas de la barbería

CUANDO EL USUARIO QUIERE HACER UNA RESERVA:
1. Pregunta qué servicio desea (si no lo mencionó)
2. Pregunta la fecha y hora preferida (si no la mencionó)
3. Sugiere barberos disponibles (o pregunta si tiene preferencia)
4. USA la función "createAppointment" para crear la reserva automáticamente
5. Confirma los detalles de la reserva creada

IMPORTANTE:
- Si el usuario dice "quiero hacer una reserva", "reserva una cita", "agendar", etc., debes usar la función createAppointment
- Si falta información (servicio, fecha, hora, barbero), pregúntala de forma conversacional
- Siempre confirma la reserva después de crearla

Siempre sé útil, conciso y profesional.`
    }

    // Define tools/functions for the assistant
    const tools = [
      {
        type: 'function',
        function: {
          name: 'getServices',
          description: 'Obtiene la lista de servicios disponibles en la barbería con sus precios y duraciones',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getBarbers',
          description: 'Obtiene la lista de barberos disponibles con sus especialidades',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'checkAvailability',
          description: 'Consulta la disponibilidad de horarios para un barbero en una fecha específica',
          parameters: {
            type: 'object',
            properties: {
              barberId: {
                type: 'string',
                description: 'ID del barbero'
              },
              date: {
                type: 'string',
                description: 'Fecha en formato YYYY-MM-DD'
              }
            },
            required: ['barberId', 'date']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'createAppointment',
          description: 'Crea una nueva reserva/cita para el usuario autenticado',
          parameters: {
            type: 'object',
            properties: {
              serviceId: {
                type: 'string',
                description: 'ID del servicio solicitado'
              },
              barberId: {
                type: 'string',
                description: 'ID del barbero seleccionado'
              },
              date: {
                type: 'string',
                description: 'Fecha de la cita en formato YYYY-MM-DD'
              },
              time: {
                type: 'string',
                description: 'Hora de la cita en formato HH:MM (ej: 14:00)'
              }
            },
            required: ['serviceId', 'barberId', 'date', 'time']
          }
        }
      }
    ]

    // Prepare messages with system prompt
    const fullMessages = [systemPrompt, ...messages]

    // Call Abacus.AI LLM API with tool calling
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: fullMessages,
        tools: tools,
        tool_choice: 'auto',
        stream: false, // Disable streaming for tool calls
        max_tokens: 1500,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`)
    }

    const data = await response.json()
    const assistantMessage = data.choices[0].message

    // Check if assistant wants to call a function
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0]
      const functionName = toolCall.function.name
      const functionArgs = JSON.parse(toolCall.function.arguments)

      let functionResult: any = null

      // Execute the requested function
      switch (functionName) {
        case 'getServices':
          const services = await prisma.service.findMany({
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              duration: true,
            }
          })
          functionResult = { services }
          break

        case 'getBarbers':
          const barbers = await prisma.barber.findMany({
            where: { isActive: true },
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          })
          functionResult = { 
            barbers: barbers.map(b => ({
              id: b.id,
              name: b.user.name,
              specialties: b.specialties,
              bio: b.bio
            }))
          }
          break

        case 'checkAvailability':
          const { barberId, date } = functionArgs
          const availabilityResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/availability?barberId=${barberId}&date=${date}`,
            { headers: { 'Content-Type': 'application/json' } }
          )
          if (availabilityResponse.ok) {
            functionResult = await availabilityResponse.json()
          } else {
            functionResult = { error: 'No se pudo consultar disponibilidad' }
          }
          break

        case 'createAppointment':
          if (!session || !session.user?.email) {
            functionResult = { 
              error: 'Debes iniciar sesión para hacer una reserva',
              requiresAuth: true
            }
            break
          }

          const user = await prisma.user.findUnique({
            where: { email: session.user.email }
          })

          if (!user) {
            functionResult = { error: 'Usuario no encontrado' }
            break
          }

          const { serviceId, barberId: appointmentBarberId, date: appointmentDate, time } = functionArgs

          // Create the appointment
          const appointment = await prisma.appointment.create({
            data: {
              clientId: user.id,
              barberId: appointmentBarberId,
              serviceId,
              date: new Date(appointmentDate),
              time,
              status: 'CONFIRMED'
            },
            include: {
              service: true,
              barber: {
                include: {
                  user: true
                }
              }
            }
          })

          functionResult = {
            success: true,
            appointment: {
              id: appointment.id,
              service: appointment.service.name,
              barber: appointment.barber.user.name,
              date: appointmentDate,
              time: time,
              status: 'CONFIRMADA'
            },
            message: `¡Reserva confirmada! Tu cita de ${appointment.service.name} con ${appointment.barber.user.name} está agendada para el ${appointmentDate} a las ${time}.`
          }
          break

        default:
          functionResult = { error: 'Función no reconocida' }
      }

      // Send function result back to LLM for final response
      const secondResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            ...fullMessages,
            assistantMessage,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              name: functionName,
              content: JSON.stringify(functionResult)
            }
          ],
          stream: true,
          max_tokens: 1000,
          temperature: 0.7
        })
      })

      if (!secondResponse.ok) {
        throw new Error(`LLM API error: ${secondResponse.statusText}`)
      }

      // Stream the final response
      const stream = new ReadableStream({
        async start(controller) {
          const reader = secondResponse.body?.getReader()
          if (!reader) {
            controller.close()
            return
          }

          const decoder = new TextDecoder()
          const encoder = new TextEncoder()

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              const chunk = decoder.decode(value)
              controller.enqueue(encoder.encode(chunk))
            }
          } catch (error) {
            console.error('Stream error:', error)
            controller.error(error)
          } finally {
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    }

    // No tool calls, return the response directly
    const content = assistantMessage.content || 'No pude procesar tu solicitud.'
    
    return NextResponse.json({ 
      content,
      role: 'assistant'
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Error processing chat request' },
      { status: 500 }
    )
  }
}
