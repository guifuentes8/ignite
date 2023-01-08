import { useState, useEffect, useRef } from "react";
import { Input } from "@components/Input";
import { Header } from "@components/Header";
import { Highlight } from "@components/Highlight";
import { ButtonIcon } from "@components/ButtonIcon";
import { Container, Form, HeaderList, NumberOfPlayers } from "./styles";
import { Filter } from "@components/Filter";
import { FlatList } from "react-native";
import { PlayerCard } from "@components/PlayerCard";
import { ListEmpty } from "@components/ListEmpty";
import { Button } from "@components/Button";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Alert } from "react-native";
import { AppError } from "@utils/AppError";
import { playerAddByGroup } from "@storage/player/playerAddByGroup";
import { playersGetByGroupAndTeam } from "@storage/player/playersGetByGroupAndTeam";
import { PlayerStorageDTO } from "@storage/player/PlayerStorageDTO";
import { TextInput } from "react-native";
import { playerRemoveByGroup } from "@storage/player/playerRemoveByGroup";
import { groupRemoveByName } from "@storage/group/groupRemoveByName";

type RouteParams = {
  group: string;
}

export function Players() {
  const [newPlayerName, setNewPlayerName] = useState('')
  const [team, setTeam] = useState('Time a');
  const [players, setPlayers] = useState<PlayerStorageDTO[]>([]);

  const navigation = useNavigation()

  const route = useRoute();

  const { group } = route.params as RouteParams;

  const newPLayerNameInputRef = useRef<TextInput>(null);

  async function handleAddPlayer() {
    if (newPlayerName.trim().length === 0) {
      return Alert.alert('Nova pessoa', 'Informe o nome da pessoa para adicionar');
    }

    const newPlayer = {
      name: newPlayerName,
      team,
    }

    try {
      await playerAddByGroup(newPlayer, group)

      newPLayerNameInputRef.current?.blur()
      setNewPlayerName('')

      fetchPlayersByTeam()

    } catch (error) {
      if (error instanceof AppError) {
        Alert.alert('Nova pessoa', error.message)
      } else {
        console.log(error);
        Alert.alert('Nova pessoa', 'Não foi possível adicionar')

      }
    }
  }

  async function fetchPlayersByTeam() {
    try {
      const playersByTeam = await playersGetByGroupAndTeam(group, team)
      setPlayers(playersByTeam)
    } catch (error) {
      console.log(error)
      Alert.alert('Nova pessoa', 'Não foi carregar as pessoas do time selecionado')
    }
  }

  async function handlePlayerRemove(playerName: string) {
    try {
      await playerRemoveByGroup(playerName, group);
      fetchPlayersByTeam();
    } catch (error) {
      console.log(error);
      Alert.alert('Remover pessoa', 'Não foi possível remover essa pessoa')
    }
  }

  async function groupRemove() {
    try {
      await groupRemoveByName(group)
      navigation.navigate('groups')
    } catch (error) {
      console.log(error)
      Alert.alert('Remover grupo', 'Não foi possível remover o grupo.')
    }
  }

  async function handleGroupRemove() {
    Alert.alert('Remover', 'Deseja remover o grupo?', [
      {
        text: 'Não', style: 'cancel'
      },
      {
        text: 'Sim', onPress: () => groupRemove()
      }
    ])
  }

  useEffect(() => {
    fetchPlayersByTeam();
  }, [team])

  return (
    <Container>
      <Header showBackButton />

      <Highlight
        title={group}
        subtitle="adicione a galera e esepare os times"
      />

      <Form>
        <Input
          inputRef={newPLayerNameInputRef}
          onChangeText={setNewPlayerName}
          value={newPlayerName}
          placeholder="Nome da pessoa"
          autoCorrect={false}
          onSubmitEditing={handleAddPlayer}
          returnKeyType="done"
        />
        <ButtonIcon icon="add" onPress={handleAddPlayer} />
      </Form>

      <HeaderList>
        <FlatList
          data={['Time a', 'time b']}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <Filter isActive={item === team} title={item} onPress={() => setTeam(item)} />
          )}
          horizontal
        />

        <NumberOfPlayers>
          {players.length}
        </NumberOfPlayers>
      </HeaderList>
      <FlatList
        data={players}
        keyExtractor={item => item.name}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingBottom: 100 }, players.length === 0 && { flex: 1 }]}
        renderItem={({ item }) => (
          <PlayerCard name={item.name} onRemove={() => handlePlayerRemove(item.name)} />
        )}
        ListEmptyComponent={() => (
          <ListEmpty
            message="Não há pessoas nesse time."
          />
        )}
      />

      <Button title="Remover turma" type="SECONDARY" onPress={handleGroupRemove} />
    </Container>
  )
}
