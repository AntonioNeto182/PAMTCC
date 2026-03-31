import React, {useState} from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ImageBackground, Image, Dimensions, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Switch } from 'react-native';

const {width, height} = Dimensions.get('window');
const isWeb = typeof navigator !== "undefined" && navigator.userAgent;

export default function App() {

const [usuario,setUsuario] = useState('');
const [email,setEmail] = useState('');
const [idadeConta,setIdadeConta] = useState(0);
const [verificada,setVerificada] = useState(true);
const [pacote,setPacote] = useState(0);

const pacotes = [
  {quant: 500, preco: 29.90},
  {quant: 1000, preco: 59.00},
  {quant: 2000, preco: 117.90},
  {quant: 5250, preco: 294.90},
  {quant: 11000, preco: 589.90},
];

const idades = [
  "Menos de 1 ano",
  "Entre 1 a 5 anos",
  "Entre 5 a 7 anos",
  "7+ anos"
];

function enviarDados(){
 if(usuario == '' || email == ''){
  alert("Preencha todos os dados");
 } else {

  let mensagem =
   "Compra de Robux aprovada!\n\n" +
   "Usuário: " + usuario + "\n" +
   "Email: " + email + "\n" +
   "Pacote: " + pacotes[pacote].quant + " Robux\n" +
   "Valor: R$ " + pacotes[pacote].preco.toFixed(2) + "\n" +
   "Idade da Conta: " + idades[idadeConta] + "\n" +
   "Conta Verificada: " + (verificada ? "Sim" : "Não");

   if(!verificada){
     mensagem += "\n\nConta não verificada: Seu robux pode ter um leve atraso.";
   }

   alert(mensagem);
 }
}

return (
<ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
<ImageBackground
  source={require("./assets/fundo.jpg")}
  style={styles.imagemfundo}
  resizeMode="cover"
>

<Text style={styles.robuxLogo}>Bem-vindo ao SIMAV</Text>

<View style={styles.areaformulario}>

<Text style={styles.textoNome}>Usuário Roblox:</Text>
<TextInput
 style={styles.input}
 placeholder="Digite seu usuário"
 onChangeText={setUsuario}
/>

<Text style={styles.textoNome}>Email para comprovante:</Text>
<TextInput
 style={styles.input}
 placeholder="Digite seu email"
 keyboardType="email-address"
 onChangeText={setEmail}
/>

<Text style={styles.textoNome}>Escolha seu pacote:</Text>
<Picker
 selectedValue={pacote}
 onValueChange={(itemValue) => setPacote(itemValue)}
>
 {pacotes.map((p,k) => (
   <Picker.Item
    key={k}
    value={k}
    label={p.quant + " Robux - R$ " + p.preco.toFixed(2)}
   />
 ))}
</Picker>

<Text style={styles.textoNome}>Qual a idade da sua conta?</Text>
<Picker
 selectedValue={idadeConta}
 onValueChange={(itemValue) => setIdadeConta(itemValue)}
>
 {idades.map((i,k) => (
   <Picker.Item key={k} value={k} label={i}/>
 ))}
</Picker>

<View style={styles.areaSwitch}>
<Text style={styles.textoNome}>
{verificada ? "Tenho conta verificada" : "Não tenho conta verificada"}
</Text>
<Switch
 style={isWeb ? { transform: [{ translateY: -2 }]} : {} }
 value={verificada}
 onValueChange={setVerificada}
/>
</View>

<TouchableOpacity style={styles.botao} onPress={enviarDados}>
<Text style={styles.botaoTexto}>Comprar Robux</Text>
</TouchableOpacity>

</View>
</ImageBackground>
</ScrollView>
);
}

const styles = StyleSheet.create({

imagemfundo: {
  width: '100%',
  minHeight: height,
  alignItems: 'center',
  paddingVertical: 30,
  height: 800
},

areaformulario:{
 width: width * 0.9,
 backgroundColor: 'rgba(20,20,20,0.95)',
 borderRadius: 18,
 padding: 20,
 gap: 16,
 borderWidth: 1,
 borderColor: '#CBB97E',
 shadowColor: '#000',
 shadowOpacity: 0.4,
 shadowRadius: 8,
 elevation: 10
},

robuxLogo:{
 textAlign: 'center',
 fontSize: 25,
 fontWeight: 'bold',
 color: '#FFD700',
 letterSpacing: 1.5,
 marginBottom: 10
},

textoNome:{
 fontSize: 15,
 fontWeight: '600',
 color: '#CBB97E',
 marginBottom: 4
},

input:{
 borderWidth: 1,
 borderColor: '#444',
 backgroundColor: '#1c1c1c',
 borderRadius: 10,
 padding: 10,
 fontSize: 15,
 color: '#fff'
},

areaSwitch:{
 marginTop: 15,
 alignItems: 'center',
 padding: 10,
 backgroundColor: '#1a1a1a',
 borderRadius: 12,
 borderWidth: 1,
 borderColor: '#333'
},

botao:{
 justifyContent: 'center',
 alignItems: 'center',
 backgroundColor: '#CBB97E',
 borderRadius: 30,
 marginTop: 25,
 height: 55,
 width: 200,
 shadowColor: '#000',
 shadowOpacity: 0.3,
 shadowRadius: 6,
 elevation: 8
},

botaoTexto:{
 fontSize: 18,
 fontWeight: 'bold',
 color: '#000'
},

image:{
 width: width * 0.35,
 height: width * 0.35,
 resizeMode: "contain",
 marginVertical: 15
}

});