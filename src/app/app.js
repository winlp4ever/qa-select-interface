// import react
import React, { Component, useState } from 'react';

// import style file
import './_app.scss';

// import 3rd party libs
import $ from 'jquery';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import Button from '@material-ui/core/Button';
import EditRoundedIcon from '@material-ui/icons/EditRounded';
import HighlightOffRoundedIcon from '@material-ui/icons/HighlightOffRounded';
import HelpTwoToneIcon from '@material-ui/icons/HelpTwoTone';
import BarChartRoundedIcon from '@material-ui/icons/BarChartRounded';
import GamesRoundedIcon from '@material-ui/icons/GamesRounded';
import TripOriginRoundedIcon from '@material-ui/icons/TripOriginRounded';
import ThumbsUpDownRoundedIcon from '@material-ui/icons/ThumbsUpDownRounded';
import FiberManualRecordRoundedIcon from '@material-ui/icons/FiberManualRecordRounded';
import FiberManualRecordOutlinedIcon from '@material-ui/icons/FiberManualRecordOutlined';
import StarHalfRoundedIcon from '@material-ui/icons/StarHalfRounded';
import ClearRoundedIcon from '@material-ui/icons/ClearRounded';
import ArrowForwardIosRoundedIcon from '@material-ui/icons/ArrowForwardIosRounded';
import ArrowBackIosRoundedIcon from '@material-ui/icons/ArrowBackIosRounded';
import CancelIcon from '@material-ui/icons/Cancel';


import {postForData} from '../utils';

const Levels = ['Master1', 'Licence3', 'Master2'];
const Keywords = ['javascript', 'js', 'html', 'css', 'php'];
const Topics = ['html', 'css', 'javascript', 'php'];

const Answer = (props) => {
    const [editAns, setEditAns] = useState(false);
    const [editLv, setEditLv] = useState(false);
    
    const toggleEditLv = () => setEditLv(!editLv);
    const toggleEditAns = () => setEditAns(!editAns);

    const handleChangeAns = (e) => {
        props.save(props.aid, e.target.value);
    }

    const chooseLevel = (s) => {
        props.modifyLv(props.aid, s);
        toggleEditLv();
    }

    return <div className='answer'>
        <Button 
            className='del' 
            onClick={props.del}
        >
            <HighlightOffRoundedIcon/>
        </Button>
        <div className='Supp Lv'>
            <span className='title'><BarChartRoundedIcon/></span>
            <span className='aid'>click to modify</span>
            {editLv?<div className='levels'>
                {Levels.map((l, id) => <span key={id} className='lv-choice'onClick={_ => chooseLevel(l)}>{l}</span>)}
                <span onClick={toggleEditLv}><ClearRoundedIcon/></span>
            </div> 
            :<span className='lv' onClick={toggleEditLv}>{props.answer.answer_level}</span>
            }
        </div>
        <div className='Supp Orientation'>
            <span className='title'><GamesRoundedIcon/></span>
            <span className='lv'>{props.answer.answer_orientation}</span>
        </div>
        {props.answer.source? <div className='Supp Origin'>
            <span className='title'><TripOriginRoundedIcon/></span>
            <span className='src'>{props.answer.source}</span>
        </div>: null}
        <div className='Ans'>
            <span className='ttle'>Answer:</span>
            {
                editAns? <TextareaAutosize
                    className='ans'
                    onChange={handleChangeAns}
                    defaultValue={props.answer.answer_paragraph}
                    onBlur={toggleEditAns}
                />: <div 
                    className='ans' 
                    onDoubleClick={toggleEditAns}
                >
                    <span className='aid'>double click to modify!</span>
                    {props.answer.answer_paragraph}
                </div>
            }
        </div>
    </div>
}

class Question extends Component {
    state = {
        displayAnswers: false,
        answers: [],
        rating: this.props.question.question_rating
    }

    componentDidMount() {

    }

    rateThisQuestion = async (score) => {
        let data = await postForData('/submit-question-rating', {
            questionid: this.props.question.id,
            rating: score
        })
        if (data.status = 'ok')
            this.setState({rating: score});
    }

    toggleDisplayAns = async () => {
        if (!this.state.displayAnswers) {
            let data = await postForData('/post-answers', {
                question: this.props.question.question_text,
                id: this.props.question.id
            });
            console.log(data);
            this.setState({answers: data.answers});
        }
        this.setState({displayAnswers: !this.state.displayAnswers});
    }

    deleteAnswer = (id) => {
        let as = this.state.answers.slice();
        as.splice(id, 1);
        this.setState({answers: as});
    }

    saveAnswerModifs = (id, a) => {
        this.state.answers[id].answer_paragraph = a;
    }

    saveAnswerLv = (id, l) => {
        this.state.answers[id].answer_level = l;
    }

    saveToDb = async () => {
        let data = await postForData('/submit-answers', {
            question: this.props.question,
            answers: this.state.answers,
            rating: this.state.rating
        })
        console.log(data);
        //props.saveQAs();
    }

    render() {
        /**
         * Rendering function
         */
        let qtext = this.props.question.question_normalized;
        for (const k of Keywords) {
            qtext = qtext.replace(k, `<b>${k}</b>`)
        }
        return <div className={'question' + (this.state.displayAnswers? ' show-answers': '')}>
            <div className='q'>
                <span className='help'><HelpTwoToneIcon/></span>
                <span>
                    <i>{this.props.question.id + '. '}</i>
                    <a dangerouslySetInnerHTML={{__html: qtext}}></a>
                    <i>{'  ' + this.props.question.nbanswers + (this.props.question.nbanswers > 1? ' answers': ' answer')}</i>
                </span>
                <Button className='modify-answers' onClick={this.toggleDisplayAns}>View Answers</Button>
            </div>
            <div className={'q-review' + (this.state.displayAnswers? ' show-answers': '')}>
                <div className='rate'>
                    <span className='vote-icon'><StarHalfRoundedIcon/></span>
                    <span>
                    {[1, 2, 3, 4, 5].map(i => {
                        if (i <= this.state.rating) 
                            return <FiberManualRecordRoundedIcon key={i} onClick={_ => this.rateThisQuestion(i)}/>
                        return <FiberManualRecordOutlinedIcon key={i} onClick={_ => this.rateThisQuestion(i)} />
                    })}
                    </span>
                    <span className='vote-urge'>Please vote this question!</span>
                </div>
            </div>
            {this.state.displayAnswers & this.props.question.nbanswers > 0? <div className='as'>
                <div className='asc'>
                    {this.state.answers.map((a, id) => <Answer 
                        answer={a} 
                        key={id} 
                        save={this.saveAnswerModifs} 
                        modifyLv={this.saveAnswerLv}
                        aid={id}
                        del={_ => this.deleteAnswer(id)}
                    />)}
                </div>
                <Button className='valid-modifs' onClick={this.saveToDb}>Save changes</Button>
            </div>: null}
        </div>
    }
}

const Tps = (props) => {
    return <div className='topics'>
        {Topics.map((t, ix) => 
        <Button 
            key={ix} 
            className={'topic' + (ix == props.currTopic? ' isCurr': '') } 
            onClick={_ => props.chooseTopic(ix)}
        >
            {t}
        </Button>)}

        <Button 
            className='unset-topic' 
            endIcon={<CancelIcon/>}
            onClick={_ => props.chooseTopic(-1)}
        >
            unset topic
        </Button>
    </div>
}

export default class App extends Component {
    state = {
        nbquestions: 0,
        questions: [],
        // questions range in the db: i = questions fr index 10*i -> 10*(i+1) exclusive
        range: 0,
        topic: -1
    }

    async componentDidMount() {
        this.setState({
            questions: (await postForData('/post-questions', {
                range: this.state.range,
                topic: this.state.topic
            })).questions,
            nbquestions: (await postForData('/post-nbquestions', {
                topic: this.state.topic
            })).nbquestions
        });
    }

    selectTopic = async (i) => {
        this.setState({
            topic: i,
            questions: (await postForData('/post-questions', {
                range: this.state.range,
                topic: i,
                topics: Topics
            })).questions,
            nbquestions: (await postForData('/post-nbquestions', {
                topic: i,
                topics: Topics
            })).nbquestions
        })
    }

    nextQuestions = async () => {
        let data = await postForData('/post-questions', {
            range: this.state.range + 1
        })
        this.setState({
            range: this.state.range + 1,
            questions: data.questions
        });
    }

    previousQuestions = async () => {
        if (this.state.range > 0) {
            let data = await postForData('/post-questions', {
                range: this.state.range - 1
            });
            this.setState({
                range: this.state.range - 1,
                questions: data.questions
            });
        }
    }

    render() {
        /**
         * Rendering function
         */
        return <div className='qa-select'>
            <Tps chooseTopic={this.selectTopic} currTopic={this.state.topic}/>
            <div className='qas'>
                {this.state.questions.map((q, _) => <Question 
                    key={q.id} 
                    question={q} 
                    rateQuestion={this.rateQuestion}
                />)}
            </div>
            <div className='controller'>
                <Button onClick={this.previousQuestions}><ArrowBackIosRoundedIcon/></Button>
                <span>{this.state.range}/{Math.ceil(this.state.nbquestions / 20)}</span>
                <Button onClick={this.nextQuestions}><ArrowForwardIosRoundedIcon/></Button>
            </div>
        </div>
    }
}