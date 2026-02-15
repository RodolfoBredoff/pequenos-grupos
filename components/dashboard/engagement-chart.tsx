'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AttendanceData {
  month: string;
  presentes: number;
  ausentes: number;
  taxa: number;
}

interface TopMember {
  name: string;
  presencas: number;
  faltas: number;
  taxa: number;
}

interface EngagementChartProps {
  monthlyData: AttendanceData[];
  topPresent: TopMember[];
  topAbsent: TopMember[];
  perfectAttendance: string[];
}

export function EngagementChart({ 
  monthlyData, 
  topPresent, 
  topAbsent,
  perfectAttendance 
}: EngagementChartProps) {
  const avgAttendance = monthlyData.length > 0
    ? (monthlyData.reduce((sum, d) => sum + d.taxa, 0) / monthlyData.length).toFixed(1)
    : 0;

  const trend = monthlyData.length >= 2
    ? monthlyData[monthlyData.length - 1].taxa - monthlyData[monthlyData.length - 2].taxa
    : 0;

  return (
    <div className="space-y-6">
      {/* Resumo Estatístico */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média de Presença</CardTitle>
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : trend < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : null}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAttendance}%</div>
            <p className="text-xs text-muted-foreground">
              {trend > 0 && `+${trend.toFixed(1)}% vs. mês anterior`}
              {trend < 0 && `${trend.toFixed(1)}% vs. mês anterior`}
              {trend === 0 && 'Estável'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">100% de Presença</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{perfectAttendance.length}</div>
            <p className="text-xs text-muted-foreground">
              {perfectAttendance.length === 1 ? 'Membro destaque' : 'Membros destaque'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Reuniões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyData.reduce((sum, d) => sum + d.presentes + d.ausentes, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Registros de presença</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Linha - Taxa de Presença Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Presença Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: number) => `${value}%`}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="taxa" 
                stroke="#4f46e5" 
                strokeWidth={2}
                name="Taxa de Presença (%)"
                dot={{ fill: '#4f46e5', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Barras - Presentes vs Ausentes */}
      <Card>
        <CardHeader>
          <CardTitle>Presentes vs Ausentes por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip labelStyle={{ color: '#000' }} />
              <Legend />
              <Bar dataKey="presentes" fill="#10b981" name="Presentes" />
              <Bar dataKey="ausentes" fill="#ef4444" name="Ausentes" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rankings */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top 5 Mais Presentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top 5 Mais Presentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPresent.length > 0 ? (
                topPresent.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.presencas} presença{member.presencas !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      {member.taxa}%
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados suficientes</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Mais Ausentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Top 5 Mais Ausentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAbsent.length > 0 ? (
                topAbsent.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.faltas} falta{member.faltas !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="destructive">
                      {member.taxa}%
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados suficientes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Membros com 100% de Presença */}
      {perfectAttendance.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Award className="h-5 w-5" />
              Membros Destaque (100% de Presença)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {perfectAttendance.map((name, index) => (
                <Badge key={index} variant="secondary" className="bg-yellow-200 text-yellow-800">
                  {name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
